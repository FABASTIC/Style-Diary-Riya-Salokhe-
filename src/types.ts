export type Category = 'Top' | 'Bottom' | 'Shoes' | 'Outerwear' | 'Accessory';
export type Weather = 'Sunny' | 'Rainy' | 'Cold' | 'Autumn' | 'Spring';

export interface ClothingItem {
  id: string;
  name: string;
  category: Category;
  imageUrl: string;
  weatherTags: Weather[];
  isFavorite?: boolean;
}

export interface Outfit {
  id: string;
  name: string;
  itemIds: string[];
  isFavorite?: boolean;
}

export interface LogEntry {
  id: string;
  date: string; // YYYY-MM-DD
  outfitId: string;
}

export interface UserData {
  items: ClothingItem[];
  outfits: Outfit[];
  logs: LogEntry[];
  currentWeather: Weather;
  preferences?: string[];
}

export const INITIAL_DATA: UserData = {
  items: [],
  outfits: [],
  logs: [],
  currentWeather: 'Sunny',
  preferences: [],
};
