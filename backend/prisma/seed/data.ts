// Reference data for the seed. Salaries are annual gross base pay in each country's own currency.

export interface SeedCountry {
  code: string;
  name: string;
  currencyCode: string;
  currencySymbol: string;
  /** Relative share of employees; 0 means the country is supported but has no staff. */
  headcountWeight: number;
  /** A typical Software Engineer salary here; every job title's pay is a multiple of it. */
  softwareEngineerSalary: number;
  firstNames: readonly string[];
  lastNames: readonly string[];
}

export interface SeedJobTitle {
  title: string;
  headcountWeight: number;
  salaryMultiplier: number;
}

const RUPEE = String.fromCodePoint(0x20b9);
const POUND = String.fromCodePoint(0x00a3);
const EURO = String.fromCodePoint(0x20ac);
const YEN = String.fromCodePoint(0x00a5);

export const COUNTRIES: readonly SeedCountry[] = [
  {
    code: 'IN',
    name: 'India',
    currencyCode: 'INR',
    currencySymbol: RUPEE,
    headcountWeight: 35,
    softwareEngineerSalary: 1_200_000,
    firstNames: ['Aarav', 'Aditya', 'Ananya', 'Arjun', 'Asha', 'Diya', 'Kavya', 'Meera', 'Neha', 'Priya', 'Rahul', 'Rohan', 'Sneha', 'Vikram'],
    lastNames: ['Das', 'Gupta', 'Iyer', 'Joshi', 'Kumar', 'Mehta', 'Nair', 'Patel', 'Rao', 'Reddy', 'Sharma', 'Singh'],
  },
  {
    code: 'US',
    name: 'United States',
    currencyCode: 'USD',
    currencySymbol: '$',
    headcountWeight: 20,
    softwareEngineerSalary: 125_000,
    firstNames: ['Ashley', 'Chris', 'Daniel', 'David', 'Emily', 'James', 'Jennifer', 'Kevin', 'Linda', 'Mary', 'Michael', 'Sarah'],
    lastNames: ['Anderson', 'Brown', 'Davis', 'Garcia', 'Johnson', 'Jones', 'Miller', 'Moore', 'Smith', 'Taylor', 'Williams', 'Wilson'],
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    currencyCode: 'GBP',
    currencySymbol: POUND,
    headcountWeight: 0,
    softwareEngineerSalary: 70_000,
    firstNames: [],
    lastNames: [],
  },
  {
    code: 'DE',
    name: 'Germany',
    currencyCode: 'EUR',
    currencySymbol: EURO,
    headcountWeight: 8,
    softwareEngineerSalary: 65_000,
    firstNames: ['Anna', 'Felix', 'Hannah', 'Jonas', 'Laura', 'Lea', 'Leon', 'Lukas', 'Max', 'Mia', 'Paul', 'Sophie'],
    lastNames: ['Becker', 'Fischer', 'Hoffmann', 'Koch', 'Meyer', 'Mueller', 'Richter', 'Schmidt', 'Schneider', 'Wagner', 'Weber', 'Wolf'],
  },
  {
    code: 'FR',
    name: 'France',
    currencyCode: 'EUR',
    currencySymbol: EURO,
    headcountWeight: 6,
    softwareEngineerSalary: 52_000,
    firstNames: ['Arthur', 'Camille', 'Chloe', 'Emma', 'Hugo', 'Ines', 'Jules', 'Lea', 'Louis', 'Lucas', 'Manon', 'Nathan'],
    lastNames: ['Bernard', 'Dubois', 'Durand', 'Laurent', 'Leroy', 'Martin', 'Moreau', 'Petit', 'Richard', 'Robert', 'Simon', 'Thomas'],
  },
  {
    code: 'CA',
    name: 'Canada',
    currencyCode: 'CAD',
    currencySymbol: 'CA$',
    headcountWeight: 7,
    softwareEngineerSalary: 95_000,
    firstNames: ['Ava', 'Benjamin', 'Charlotte', 'Chloe', 'Emma', 'Ethan', 'Jacob', 'Liam', 'Maya', 'Noah', 'Olivia', 'Owen'],
    lastNames: ['Brown', 'Campbell', 'Clark', 'Gagnon', 'Leblanc', 'Lee', 'MacDonald', 'Martin', 'Roy', 'Singh', 'Tremblay', 'Wong'],
  },
  {
    code: 'AU',
    name: 'Australia',
    currencyCode: 'AUD',
    currencySymbol: 'A$',
    headcountWeight: 6,
    softwareEngineerSalary: 110_000,
    firstNames: ['Amelia', 'Chloe', 'Grace', 'Henry', 'Isla', 'Jack', 'Lachlan', 'Oliver', 'Ruby', 'Thomas', 'William', 'Zoe'],
    lastNames: ['Brown', 'Harris', 'Jones', 'Kelly', 'Nguyen', 'Ryan', 'Smith', 'Taylor', 'Walker', 'White', 'Williams', 'Wilson'],
  },
  {
    code: 'SG',
    name: 'Singapore',
    currencyCode: 'SGD',
    currencySymbol: 'S$',
    headcountWeight: 5,
    softwareEngineerSalary: 85_000,
    firstNames: ['Daniel', 'Hui Min', 'Jun Jie', 'Kai Xuan', 'Marcus', 'Mei', 'Muhammad', 'Priya', 'Rachel', 'Ravi', 'Siti', 'Wei Ling'],
    lastNames: ['Chua', 'Goh', 'Koh', 'Lee', 'Lim', 'Ng', 'Ong', 'Pillai', 'Rahman', 'Tan', 'Teo', 'Wong'],
  },
  {
    code: 'JP',
    name: 'Japan',
    currencyCode: 'JPY',
    currencySymbol: YEN,
    headcountWeight: 7,
    softwareEngineerSalary: 6_500_000,
    firstNames: ['Aoi', 'Haruto', 'Hina', 'Kaito', 'Mio', 'Ren', 'Riku', 'Sakura', 'Sota', 'Yui', 'Yuna', 'Yuto'],
    lastNames: ['Ito', 'Kato', 'Kobayashi', 'Nakamura', 'Sato', 'Suzuki', 'Takahashi', 'Tanaka', 'Watanabe', 'Yamada', 'Yamamoto', 'Yoshida'],
  },
  {
    code: 'BR',
    name: 'Brazil',
    currencyCode: 'BRL',
    currencySymbol: 'R$',
    headcountWeight: 6,
    softwareEngineerSalary: 130_000,
    firstNames: ['Ana', 'Beatriz', 'Camila', 'Gabriel', 'Joao', 'Julia', 'Larissa', 'Lucas', 'Maria', 'Mateus', 'Pedro', 'Rafael'],
    lastNames: ['Almeida', 'Carvalho', 'Costa', 'Ferreira', 'Gomes', 'Lima', 'Oliveira', 'Pereira', 'Rodrigues', 'Santos', 'Silva', 'Souza'],
  },
];

export const JOB_TITLES: readonly SeedJobTitle[] = [
  { title: 'Software Engineer', headcountWeight: 30, salaryMultiplier: 1.0 },
  { title: 'Senior Software Engineer', headcountWeight: 14, salaryMultiplier: 1.45 },
  { title: 'Engineering Manager', headcountWeight: 5, salaryMultiplier: 1.9 },
  { title: 'Product Manager', headcountWeight: 7, salaryMultiplier: 1.5 },
  { title: 'Data Analyst', headcountWeight: 10, salaryMultiplier: 0.85 },
  { title: 'QA Engineer', headcountWeight: 9, salaryMultiplier: 0.8 },
  { title: 'UX Designer', headcountWeight: 7, salaryMultiplier: 0.9 },
  { title: 'HR Specialist', headcountWeight: 6, salaryMultiplier: 0.7 },
  { title: 'Sales Executive', headcountWeight: 12, salaryMultiplier: 0.75 },
];
