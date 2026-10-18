import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:8080';
const SERVICE_ACCOUNT_EMAIL = process.env.SERVICE_ACCOUNT_EMAIL || 'admin@company.com';
const SERVICE_ACCOUNT_PASSWORD = process.env.SERVICE_ACCOUNT_PASSWORD || 'admin123';

class ApiService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: BACKEND_API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor to attach bearer token
    this.client.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
      if (!this.token) {
        await this.authenticate();
      }
      if (this.token && config.headers) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor to handle token expiration (401)
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error: any) => {
        if (error.response?.status === 401 && !error.config._retry) {
          error.config._retry = true;
          await this.authenticate();
          if (error.config.headers) {
            error.config.headers.Authorization = `Bearer ${this.token}`;
          }
          return this.client(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  private async authenticate(): Promise<void> {
    try {
      const response = await axios.post(`${BACKEND_API_URL}/auth/login`, {
        email: SERVICE_ACCOUNT_EMAIL,
        password: SERVICE_ACCOUNT_PASSWORD,
      });
      this.token = response.data.token;
    } catch (err: any) {
      console.error('Failed to authenticate MCP Service Account with Spring Boot Backend:', err.message);
      throw new Error('MCP Backend Authentication Failed');
    }
  }

  public async get(url: string, params?: any) {
    const res = await this.client.get(url, { params });
    return res.data;
  }

  public async put(url: string, data?: any) {
    const res = await this.client.put(url, data);
    return res.data;
  }
}

export const apiService = new ApiService();