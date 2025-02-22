import ActualYield from '../models/ActualYield';

class ActualYieldService {
  public async createActualYield(data: any, userId: string, locationId: string): Promise<any> {
    const actualYield = new ActualYield({
      ...data,
      user: userId,
      location: locationId,
    });
    await actualYield.save();
    return actualYield;
  }

  public async getActualYieldsByUser(userId: string): Promise<any> {
    return ActualYield.find({ user: userId });
  }

  public async getActualYieldById(id: string): Promise<any> {
    return ActualYield.findById(id);
  }

  public async deleteActualYield(id: string): Promise<any> {
    return ActualYield.deleteOne({ _id: id });
  }
}

export default new ActualYieldService();