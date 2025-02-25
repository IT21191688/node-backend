"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseService = void 0;
const app_1 = require("firebase-admin/app");
const database_1 = require("firebase-admin/database");
const firestore_1 = require("firebase-admin/firestore");
class FirebaseService {
    constructor() {
        try {
            const config = {
                credential: {
                    projectId: process.env.FIREBASE_PROJECT_ID || '',
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
                    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
                },
                databaseURL: process.env.FIREBASE_DATABASE_URL || ''
            };
            const app = (0, app_1.initializeApp)({
                credential: (0, app_1.cert)(config.credential),
                databaseURL: config.databaseURL
            });
            this.db = (0, firestore_1.getFirestore)(app);
            this.rtdb = (0, database_1.getDatabase)(app);
            console.log('Firebase initialized successfully');
        }
        catch (error) {
            console.error('Error initializing Firebase:', error);
            throw error;
        }
    }
    static getInstance() {
        if (!FirebaseService.instance) {
            FirebaseService.instance = new FirebaseService();
        }
        return FirebaseService.instance;
    }
    async getSoilMoistureReadings(deviceId) {
        try {
            const ref = this.rtdb.ref(`devices/${deviceId}/readings`);
            const snapshot = await ref.orderByChild('timestamp').limitToLast(1).once('value');
            if (!snapshot.exists()) {
                return null;
            }
            const data = Object.values(snapshot.val())[0];
            return {
                moisture10cm: data.moisture10cm,
                moisture20cm: data.moisture20cm,
                moisture30cm: data.moisture30cm,
                timestamp: new Date(data.timestamp)
            };
        }
        catch (error) {
            console.error('Error getting soil moisture readings:', error);
            throw error;
        }
    }
    subscribeSoilMoistureUpdates(deviceId, callback) {
        const ref = this.rtdb.ref(`devices/${deviceId}/readings`);
        ref.on('child_added', (snapshot) => {
            callback(snapshot.val());
        });
    }
    async storeReadingHistory(deviceId, reading) {
        try {
            await this.db.collection('deviceReadings')
                .doc(deviceId)
                .collection('history')
                .add({
                ...reading,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('Error storing reading history:', error);
            throw error;
        }
    }
    async getReadingHistory(deviceId, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const snapshot = await this.db.collection('deviceReadings')
                .doc(deviceId)
                .collection('history')
                .where('timestamp', '>=', startDate)
                .orderBy('timestamp', 'desc')
                .get();
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Error getting reading history:', error);
            throw error;
        }
    }
    async getCopraMoistureReadings(deviceId) {
        try {
            const ref = this.rtdb.ref(`copraDevices/${deviceId}/readings`);
            const snapshot = await ref.orderByChild('timestamp').limitToLast(1).once('value');
            if (!snapshot.exists()) {
                return null;
            }
            const data = Object.values(snapshot.val())[0];
            return {
                moistureLevel: data.moistureLevel,
                timestamp: new Date(data.timestamp)
            };
        }
        catch (error) {
            console.error('Error getting soil moisture readings:', error);
            throw error;
        }
    }
    subscribeCopraMoistureUpdates(deviceId, callback) {
        const ref = this.rtdb.ref(`CopraDevices/${deviceId}/readings`);
        ref.on('child_added', (snapshot) => {
            callback(snapshot.val());
        });
    }
    async storeCopraReadingHistory(deviceId, reading) {
        try {
            await this.db.collection('CopraDeviceReadings')
                .doc(deviceId)
                .collection('history')
                .add({
                ...reading,
                timestamp: new Date()
            });
        }
        catch (error) {
            console.error('Error storing reading history:', error);
            throw error;
        }
    }
    async getCopraReadingHistory(deviceId, days = 7) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            const snapshot = await this.db.collection('copraDeviceReadings')
                .doc(deviceId)
                .collection('history')
                .where('timestamp', '>=', startDate)
                .orderBy('timestamp', 'desc')
                .get();
            return snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error('Error getting reading history:', error);
            throw error;
        }
    }
}
exports.firebaseService = FirebaseService.getInstance();
//# sourceMappingURL=firebase.js.map