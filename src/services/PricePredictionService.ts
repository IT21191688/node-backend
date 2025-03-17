import axios from 'axios';
import PricePrediction from '../models/PricePrediction';

class PricePredictionService {
    private predictionApiUrl = 'https://flask-be-deploy.onrender.com/predict_price';
    
    public async predictPrice(data: any): Promise<any> {
        try {
            const response = await axios.post(this.predictionApiUrl, data, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
            return response.data;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error('Error predicting price: ' + error.message);
            } else {
                throw new Error('Error predicting price');
            }
        }
    }

    public async createPricePrediction(data: any, userId: string, locationId: string): Promise<any> {
        try {
            const predictionResponse = await this.predictPrice(data);
            const predictionDate = new Date(data.prediction_date);
            const year = predictionDate.getFullYear();
            const month = predictionDate.toLocaleString('default', { month: 'long' });

            // First, set isLatest to false for any existing predictions with the same month and year
            await PricePrediction.updateMany(
                { 
                    user: userId, 
                    location: locationId, 
                    month: month, 
                    year: year,
                    isLatest: true
                },
                { 
                    isLatest: false 
                }
            );

            // Create the new prediction with isLatest set to true
            const pricePrediction = new PricePrediction({
                ...data,
                ...predictionResponse,
                user: userId,
                location: locationId,
                year,
                month,
                isLatest: true // Explicitly set to true
            });
            
            // Save the new prediction
            await pricePrediction.save();
            return pricePrediction;
        } catch (error) {
            if (error instanceof Error) {
                throw new Error('Error creating price prediction: ' + error.message);
            } else {
                throw new Error('Error creating price prediction');
            }
        }
    }

    public async getAllPricePredictions(): Promise<any> {
        return PricePrediction.find().sort({ createdAt: -1 });
    }

    public async getPricePredictionById(id: string): Promise<any> {
        return PricePrediction.findById(id);
    }

    public async getPricePredictionsByUser(userId: string): Promise<any> {
        return PricePrediction.find({ user: userId })
            .sort({ isLatest: -1, createdAt: -1 });
    }

    public async getLatestPricePredictions(userId: string): Promise<any> {
        return PricePrediction.find({ 
            user: userId,
            isLatest: true 
        }).sort({ year: -1, month: -1 });
    }

    public async deletePricePrediction(id: string): Promise<any> {
        return PricePrediction.deleteOne({ _id: id });
    }
}

export default new PricePredictionService();