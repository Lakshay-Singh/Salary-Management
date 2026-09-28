export interface Country {
  code: string;
  name: string;
  currencyCode: string;
}

export interface CountryRepository {
  findByCode(code: string): Promise<Country | null>;
  findAll(): Promise<Country[]>;
}
