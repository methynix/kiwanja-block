import { Injectable, NotFoundException } from '@nestjs/common';

export interface NidaCitizen {
  nin: string;
  firstName: string;
  middleName: string;
  lastName: string;
  sex: 'M' | 'F';
  dateOfBirth: string;
  region: string;
  district: string;
}

/** Mock of the NIDA identity lookup. Replace with the real API client once credentials are available. */
const MOCK_CITIZENS: NidaCitizen[] = [
  {
    nin: '19850412-11111-00001-21',
    firstName: 'Amina',
    middleName: 'Juma',
    lastName: 'Mwakasege',
    sex: 'F',
    dateOfBirth: '1985-04-12',
    region: 'Dar es Salaam',
    district: 'Kinondoni',
  },
  {
    nin: '19900723-22222-00002-15',
    firstName: 'Baraka',
    middleName: 'Emmanuel',
    lastName: 'Mushi',
    sex: 'M',
    dateOfBirth: '1990-07-23',
    region: 'Arusha',
    district: 'Arusha Urban',
  },
  {
    nin: '19781130-33333-00003-08',
    firstName: 'Neema',
    middleName: 'Hassan',
    lastName: 'Kimaro',
    sex: 'F',
    dateOfBirth: '1978-11-30',
    region: 'Dodoma',
    district: 'Dodoma Urban',
  },
];

@Injectable()
export class NidaService {
  async verify(nin: string): Promise<NidaCitizen> {
    await new Promise((r) => setTimeout(r, 300)); // simulate network latency
    const citizen = MOCK_CITIZENS.find((c) => c.nin === nin.trim());
    if (!citizen) throw new NotFoundException(`No NIDA record for NIN ${nin}`);
    return citizen;
  }
}
