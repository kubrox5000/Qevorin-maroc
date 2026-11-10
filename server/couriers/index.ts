/**
 * QEVORIN – Central Courier Adapters Registry
 * Manages registered courier adapters and provides a unified entry point.
 */

import { CourierAdapter } from './courier.interface';
import { ozonExpressService } from './ozon-express/ozon.service';

const adapters: Map<string, CourierAdapter> = new Map();

// Register initial courier adapters
adapters.set(ozonExpressService.code, ozonExpressService);

/**
 * Retrieves a courier adapter by its unique code (e.g. 'ozon_express')
 */
export function getCourierAdapter(code: string = 'ozon_express'): CourierAdapter | undefined {
  return adapters.get(code);
}

/**
 * Returns all registered courier adapters
 */
export function getAllCourierAdapters(): CourierAdapter[] {
  return Array.from(adapters.values());
}

export * from './courier.interface';
export * from './ozon-express/ozon.service';
export * from './ozon-express/ozon.mapper';
export * from './ozon-express/ozon.types';
