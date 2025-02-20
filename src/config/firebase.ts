import { initializeApp, cert } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';
import { getFirestore } from 'firebase-admin/firestore';
import path from 'path';

interface FirebaseConfig {
    credential: {
        projectId: string;
        clientEmail: string;
        privateKey: string;
    };
    databaseURL: string;
}

class FirebaseService {
    private static instance: FirebaseService;
    private db: any;
    private rtdb: any;

    private constructor() {
        try {
            const config: FirebaseConfig = {
                credential: {
                    projectId: process.env.FIREBASE_PROJECT_ID || '',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
                    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                },
                databaseURL: process.env.FIREBASE_DATABASE_URL || ''
            };

            // Initialize Firebase Admin
            const app = initializeApp({
                credential: cert(config.credential),
                databaseURL: config.databaseURL
            });

            // Initialize Firestore and Realtime Database
            this.db = getFirestore(app);
            this.rtdb = getDatabase(app);

            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            throw error;
        }
    }

    public static getInstance(): FirebaseService {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }

    // Get Soil Moisture Readings
    public async getSoilMoistureReadings(deviceId: string): Promise<{
        moisture10cm: number;
        moisture20cm: number;
        moisture30cm: number;
        timestamp: Date;
    } | null> {
        try {
            const ref = this.rtdb.ref(`devices/${deviceId}/readings`);
            const snapshot = await ref.orderByChild('timestamp').limitToLast(1).once('value');
            
            if (!snapshot.exists()) {
                return null;
            }

            const data = Object.values(snapshot.val())[0] as any;
            return {
                moisture10cm: data.moisture10cm,
                moisture20cm: data.moisture20cm,
                moisture30cm: data.moisture30cm,
                timestamp: new Date(data.timestamp)
            };
        } catch (error) {
            console.error('Error getting soil moisture readings:', error);
            throw error;
        }
    }

    // Subscribe to Soil Moisture Updates
    public subscribeSoilMoistureUpdates(deviceId: string, callback: (data: any) => void): void {
        const ref = this.rtdb.ref(`devices/${deviceId}/readings`);
        ref.on('child_added', (snapshot: any) => {
            callback(snapshot.val());
        });
    }

    // Store Device Reading History
    public async storeReadingHistory(deviceId: string, reading: any): Promise<void> {
        try {
            await this.db.collection('deviceReadings')
                .doc(deviceId)
                .collection('history')
                .add({
                    ...reading,
                    timestamp: new Date()
                });
        } catch (error) {
            console.error('Error storing reading history:', error);
            throw error;
        }
    }

    // Get Device Reading History
    public async getReadingHistory(deviceId: string, days: number = 7): Promise<any[]> {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const snapshot = await this.db.collection('deviceReadings')
                .doc(deviceId)
                .collection('history')
                .where('timestamp', '>=', startDate)
                .orderBy('timestamp', 'desc')
                .get();

            return snapshot.docs.map((doc: { id: any; data: () => any; }) => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting reading history:', error);
            throw error;
        }
    }
}

export const firebaseService = FirebaseService.getInstance();