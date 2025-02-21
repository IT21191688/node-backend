import { Schema, model, Document } from 'mongoose';

interface IMonthlyData {
  month: number;
  sm_10: number;
  sm_20: number;
  sm_30: number;
  age: number;
  soil_type: number;
  temperature: number;
  humidity: number;
  rainfall: number;
  weatherDescription: string;
}

interface IYieldPrediction extends Document {
  year: number;
  monthly_data: IMonthlyData[];
  predicted_yield: number;
}

const MonthlyDataSchema = new Schema<IMonthlyData>({
  month: { type: Number, required: true },
  sm_10: { type: Number, required: true },
  sm_20: { type: Number, required: true },
  sm_30: { type: Number, required: true },
  age: { type: Number, required: true },
  soil_type: { type: Number, required: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  rainfall: { type: Number, required: true },
  weatherDescription: { type: String, required: true },
});

const YieldPredictionSchema = new Schema<IYieldPrediction>({
  year: { type: Number, required: true },
  monthly_data: { type: [MonthlyDataSchema], required: true },
  predicted_yield: { type: Number, required: true },
});

const YieldPrediction = model<IYieldPrediction>('YieldPrediction', YieldPredictionSchema);

export default YieldPrediction;