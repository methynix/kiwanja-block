export interface PolicySection {
  heading: string
  paragraphs?: string[]
  list?: string[]
  table?: { head: string[]; rows: string[][] }
}

export interface PolicyDoc {
  title: string
  summary: string
  updated: string
  sections: PolicySection[]
}

export const privacyPolicy: PolicyDoc = {
  title: 'Privacy policy',
  summary:
    'Kiwanja Block records land sales. That means it handles names, NIDA numbers, photos and locations. This page explains exactly what is collected, why, who can see it and how long it stays.',
  updated: '12 October 2026',
  sections: [
    {
      heading: 'Who runs this service',
      paragraphs: [
        'Kiwanja Block is a pilot built during Industrial Practical Training at the e-Government Authority Research, Innovation and Development Centre in Dodoma. During the pilot the project team is responsible for the data described here. We handle personal data in line with the Personal Data Protection Act, 2022 of the United Republic of Tanzania.',
      ],
    },
    {
      heading: 'What we collect and why',
      table: {
        head: ['Data', 'When', 'Why we need it'],
        rows: [
          ['Phone number and password', 'When an account is created', 'To sign you in. Passwords are stored only as a bcrypt hash.'],
          ['Full name and NIDA number', 'Citizen sign up, plot registration, each sale', 'To confirm that the person matches the national identity record and to link plots and sales to the right owner.'],
          ['Date of birth', 'Citizen sign up only', 'Checked once against NIDA to confirm identity. It is not stored afterwards.'],
          ['Ward, district and region', 'Staff accounts and plot records', 'To limit each Mwenyekiti to the plots in their own ward.'],
          ['Photo of each party', 'At the moment each person signs a sale', 'To show who was present when the sale was witnessed.'],
          ['Location of each party', 'Only when the signer presses Capture location', 'To check the sale was signed at or near the plot.'],
          ['Sale price', 'At the moment of the sale', 'It is part of the agreement both parties sign.'],
          ['IP address and time of failed sign in attempts', 'Security events only', 'To detect password guessing and misuse.'],
        ],
      },
    },
    {
      heading: 'What we do not collect',
      list: [
        'No analytics, advertising or tracking scripts of any kind.',
        'No continuous location. Location is read once, when a button is pressed during a signature.',
        'No contacts, call logs or files from your phone.',
        'No third party fonts, maps or embeds that would report your visit to someone else.',
      ],
    },
    {
      heading: 'Who can see your information',
      table: {
        head: ['Who', 'What they see'],
        rows: [
          ['You, as a citizen', 'Plots registered to your NIDA number and the sales where you are buyer or seller, with certificates.'],
          ['The Mwenyekiti of the ward', 'Plots and sales in their own ward only, including the photos taken at signing.'],
          ['Land officers', 'Plots and sales across wards, to review and forward transfers to the Ministry of Lands.'],
          ['Anyone who scans a certificate', 'Whether the certificate matches the sealed record, the plot number, ward, date and the initials of the parties. Never the NIN, photos or price.'],
        ],
      },
    },
    {
      heading: 'Where the data is kept and for how long',
      list: [
        'Records are stored in a CouchDB database operated for the pilot.',
        'When a Mwenyekiti works offline, the sale is kept in the browser’s storage on that phone until it uploads, then the photos are deleted from the phone. Signing out deletes all offline copies.',
        'Completed sales are land records and are kept for as long as the land register requires them.',
        'Security logs are kept for 90 days.',
        'Accounts stay until you ask us to close them. Closing an account does not erase sales that other people relied on.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        'You can ask to see the information held about you, to correct it, or to close your account. Corrections to a plot or sale go through your ward land office so the change is witnessed and logged. If you believe your data has been mishandled you can complain to the Personal Data Protection Commission.',
      ],
    },
    {
      heading: 'How the data is protected',
      list: [
        'All traffic is served over HTTPS in production.',
        'Sign in uses a short lived access token and a refresh cookie that scripts cannot read. Signing out ends the session on the server.',
        'Every request is checked for both identity and permission, not only identity.',
        'Each sale is sealed with a SHA-256 fingerprint, so any later change to the record is detectable.',
      ],
    },
    {
      heading: 'Changes to this policy',
      paragraphs: ['If this policy changes, the date at the top changes and the new version applies from that date.'],
    },
  ],
}

export const termsOfUse: PolicyDoc = {
  title: 'Terms of use',
  summary: 'The rules for using Kiwanja Block during the pilot. Short version: tell the truth, sign only when everyone is present, and treat the certificate as evidence of a witnessed sale, not as a title deed.',
  updated: '12 October 2026',
  sections: [
    {
      heading: 'What Kiwanja Block is',
      paragraphs: [
        'Kiwanja Block records street level land sales that are witnessed by the seller, the buyer and the Mwenyekiti, and produces a certificate that anyone can verify. It is a pilot. The certificate is evidence that a sale was agreed and witnessed. It does not replace a title deed or registration with the Ministry of Lands.',
      ],
    },
    {
      heading: 'Accounts',
      list: [
        'Citizens may create their own account. The name, NIDA number and date of birth must match the national identity record.',
        'Mwenyekiti and land officer accounts are created by a land officer, never through public sign up.',
        'Keep your password private. You are responsible for actions taken with your account until you tell your ward office it was compromised.',
      ],
    },
    {
      heading: 'Recording a sale',
      list: [
        'All three people must be physically present at the plot when they sign.',
        'Each person must agree, by ticking the consent box themselves, to the price and to their photo and location being recorded.',
        'Do not photograph anyone who has not agreed to sign.',
        'A sale recorded offline only becomes valid once the server accepts it. The server refuses the sale if the seller no longer owns the plot at that moment.',
      ],
    },
    {
      heading: 'Things you must not do',
      list: [
        'Use another person’s identity or NIDA number.',
        'Record a sale for a plot you know is already sold or disputed.',
        'Attempt to alter, copy or forge a certificate or its QR code.',
        'Probe, overload or attempt to break into the service.',
      ],
    },
    {
      heading: 'Fees and refunds',
      paragraphs: [
        'Kiwanja Block is free to use. We charge no fees, so there is nothing to refund. The price of a plot is paid between buyer and seller outside the service. Kiwanja Block never receives, holds or transfers money.',
      ],
    },
    {
      heading: 'Availability and liability',
      paragraphs: [
        'We work to keep the service available, but during the pilot it may be interrupted for maintenance. A sale stored on a phone may fail to upload if the phone is lost or reset before it reconnects. To the extent the law allows, the project team is not liable for losses arising from a sale between buyer and seller.',
      ],
    },
    {
      heading: 'Law and contact',
      paragraphs: ['These terms are governed by the laws of the United Republic of Tanzania. Questions about a specific sale go to your Mwenyekiti or ward land office.'],
    },
  ],
}

export const cookiePolicy: PolicyDoc = {
  title: 'Cookie policy',
  summary: 'Kiwanja Block uses one cookie, only after you sign in, and only to keep you signed in. Nothing here tracks you.',
  updated: '12 October 2026',
  sections: [
    {
      heading: 'Cookies and storage we use',
      table: {
        head: ['Name', 'Type', 'Purpose', 'Lasts'],
        rows: [
          ['kb_rt', 'Cookie, strictly necessary', 'Keeps you signed in. Scripts cannot read it, it is sent only to the sign in service, and only by this site.', '7 days, or until you sign out'],
          ['kb_cookie_notice_v1', 'Browser storage', 'Remembers that you closed the cookie notice.', 'Until you clear site data'],
          ['kb_cache', 'Browser database', 'Staff only. A copy of your ward’s plots and your profile so you can work offline.', 'Until you sign out'],
          ['kb_outbox', 'Browser database', 'Staff only. Sales recorded offline that are waiting to upload.', 'Until uploaded or until you sign out'],
        ],
      },
    },
    {
      heading: 'What we do not use',
      list: ['No analytics cookies.', 'No advertising cookies.', 'No third party cookies, pixels or embedded content.'],
    },
    {
      heading: 'Why there is no consent pop-up',
      paragraphs: [
        'Consent is required for cookies that are not needed to provide the service you asked for. The only cookie here is needed for sign in, so it does not require consent. We still show a short notice so you know it exists.',
      ],
    },
    {
      heading: 'Removing them',
      paragraphs: ['Signing out deletes the session cookie and all offline copies. You can also clear site data in your browser settings at any time.'],
    },
  ],
}
