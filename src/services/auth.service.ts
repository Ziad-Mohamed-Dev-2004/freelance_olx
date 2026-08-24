import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.model';
import Token from '../models/token.model';
import { TokenType } from '../interfaces/token.interface';
import { verifyToken } from './token.service';
import userAccountService from './user-account.service';
import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/AppError';
import { UserRole, UserStatus } from '../interfaces/user.interface';
import { config } from '../config/env.config';

const googleClient = new OAuth2Client(config.google.clientId, config.google.clientSecret);

/**
 * Registers a new user.
 * Throws ConflictError if the email is already in use.
 */
export const registerUser = async (userData: {
  name: string;
  email: string;
  password: string;
  phone?: string;
}) => {
  if (await User.findOne({ email: userData.email })) {
    throw new ConflictError('Email address is already registered');
  }
  const user = await User.create(userData);
  return user;
};

/**
 * Validates email/password credentials and returns the user.
 * Throws UnauthorizedError for invalid credentials.
 */
export const loginUserWithEmailAndPassword = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  if (!user.password && user.authProvider === 'google') {
    throw new UnauthorizedError('This account was created using Google Sign-In. Please sign in with Google.');
  }

  if (!(await user.isPasswordMatch(password))) {
    throw new UnauthorizedError('Incorrect email or password');
  }

  if (user.role !== UserRole.ADMIN && !user.isEmailVerified) {
    throw new UnauthorizedError('Please verify your email OTP before logging in');
  }

  return user;
};

interface GoogleAuthInput {
  idToken?: string;
  credential?: string;
  code?: string;
  redirectUri?: string;
}

/**
 * Authenticates (login or register) a user with a Google ID token, credential, or OAuth authorization code.
 */
export const loginOrRegisterWithGoogle = async (input: string | GoogleAuthInput) => {
  let idToken: string | undefined;
  let code: string | undefined;
  let redirectUri: string | undefined;

  if (typeof input === 'string') {
    idToken = input;
  } else {
    idToken = input.idToken || input.credential;
    code = input.code;
    redirectUri = input.redirectUri;
  }

  if (!idToken && code) {
    try {
      const { tokens } = await googleClient.getToken({
        code,
        redirect_uri: redirectUri || 'postmessage',
      });
      idToken = tokens.id_token ?? undefined;
    } catch (err: any) {
      throw new UnauthorizedError('Failed to exchange Google authorization code: ' + (err.message || err));
    }
  }

  if (!idToken) {
    throw new BadRequestError('Either idToken (credential) or authorization code is required');
  }

  let ticket;
  try {
    ticket = await googleClient.verifyIdToken({
      idToken,
      audience: config.google.clientId,
    });
  } catch (err: any) {
    throw new UnauthorizedError('Invalid or expired Google token');
  }

  const payload = ticket.getPayload();
  if (!payload || !payload.email) {
    throw new BadRequestError('Google token does not contain a valid email address');
  }

  const { sub: googleId, email, name, picture, email_verified } = payload;

  let user = await User.findOne({
    $or: [{ googleId }, { email: email.toLowerCase() }],
  });

  if (user) {
    if (user.isDeleted) {
      throw new UnauthorizedError('User account has been deleted');
    }
    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedError('User account is inactive or suspended');
    }

    let modified = false;
    if (!user.googleId) {
      user.googleId = googleId;
      modified = true;
    }
    if (!user.isEmailVerified && email_verified) {
      user.isEmailVerified = true;
      modified = true;
    }
    if (!user.avatar && picture) {
      user.avatar = picture;
      modified = true;
    }
    if (modified) {
      await user.save();
    }
  } else {
    user = await User.create({
      name: name || email.split('@')[0],
      email: email.toLowerCase(),
      googleId,
      authProvider: 'google',
      isEmailVerified: email_verified ?? true,
      avatar: picture,
      status: UserStatus.ACTIVE,
      role: UserRole.USER,
    });
  }

  return user;
};


/**
 * Invalidates a refresh token by deleting it from the database.
 */
export const logout = async (refreshToken: string) => {
  const refreshTokenDoc = await Token.findOne({
    token: refreshToken,
    type: TokenType.REFRESH,
    blacklisted: false,
  });
  if (!refreshTokenDoc) {
    throw new BadRequestError('Refresh token not found');
  }
  await refreshTokenDoc.deleteOne();
};

/**
 * Exchanges a valid refresh token for a user object.
 * The caller (controller) is responsible for generating new tokens.
 */
export const refreshAuth = async (refreshToken: string) => {
  const refreshTokenDoc = await verifyToken(refreshToken, TokenType.REFRESH);
  const user = await User.findById(refreshTokenDoc.user);
  if (!user || user.isDeleted || user.status !== UserStatus.ACTIVE) {
    throw new UnauthorizedError('User not found');
  }
  await refreshTokenDoc.deleteOne();
  return user;
};

/**
 * Resets the user's password using a valid reset token.
 */
export const resetPassword = async (resetPasswordToken: string, newPassword: string) => {
  const resetPasswordTokenDoc = await verifyToken(resetPasswordToken, TokenType.RESET_PASSWORD);
  const user = await User.findById(resetPasswordTokenDoc.user);
  if (!user) {
    throw new BadRequestError('Password reset failed: user not found');
  }
  user.password = newPassword;
  await user.save(); // pre-save hook will hash it
  await Token.deleteMany({ user: user._id, type: TokenType.RESET_PASSWORD });
};

/**
 * Permanently deletes the current user's account and all related data.
 */
export const deleteCurrentUserAccount = async (userId: string) => {
  return userAccountService.hardDelete(userId);
};
