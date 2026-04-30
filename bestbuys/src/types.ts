export type CategoryId = 'phone' | 'laptop' | 'headphones';

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Choice {
  id: string;
  label: string;
  tags?: string[];
  min?: number;
  max?: number;
}

export interface Question {
  id: string;
  text: string;
  choices: Choice[];
}

export interface Product {
  id: string;
  brand: string;
  model: string;
  price: number;
  rating: number;
  reviews: number;
  tags: string[];
  color: string;
  specs: string[];
  category: CategoryId;
  score: number;
}

export interface Message {
  role: 'bot' | 'user';
  text: string;
}

export type Answers = Record<string, string>;
