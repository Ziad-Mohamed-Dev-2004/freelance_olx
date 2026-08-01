import DeviceToken from '../models/device-token.model';
export class DeviceTokenService {
  async register(user: string, token?: string, platform?: 'ios' | 'android' | 'web') {
    if (!token || token.length > 4096) return;
    await DeviceToken.findOneAndUpdate(
      { token },
      { user, token, platform },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).exec();
  }
  async tokensForUser(user: string) {
    return (await DeviceToken.find({ user }).select('token').lean()).map((item) => item.token);
  }
}
export default new DeviceTokenService();
