import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from '../constants/Config';

const api = axios.create({
    baseURL: Config.BASE_URL,
});

// Add a request interceptor to inject the token
api.interceptors.request.use(async (config) => {
    try {
        const userInfo = await AsyncStorage.getItem('userInfo');
        if (userInfo) {
            const token = JSON.parse(userInfo).token;
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        console.error('Error fetching token from storage:', error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

export default api;
