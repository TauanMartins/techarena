import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { loadConfiguration } from '../config/environment.js';
import { databaseOptions } from './database.options.js';

export default new DataSource(databaseOptions(loadConfiguration()));
