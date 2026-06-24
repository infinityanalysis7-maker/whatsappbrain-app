/** Intelligent offline fallback when Groq is unavailable — keyed by Indian SMB types */
const SERVICE_MAP: Record<string, string[]> = {
  salon: ['Haircut', 'Hair Colour', 'Facial', 'Shave', 'Head Massage'],
  parlour: ['Haircut', 'Threading', 'Facial', 'Manicure', 'Bridal Makeup'],
  restaurant: ['Dine-in', 'Takeaway', 'Home Delivery', 'Catering', 'Party Orders'],
  cafe: ['Coffee & Beverages', 'Snacks', 'Breakfast', 'Takeaway', 'Custom Cakes'],
  clinic: ['General Consultation', 'Blood Test', 'ECG', 'Vaccination', 'Health Checkup'],
  hospital: ['OPD Consultation', 'Lab Tests', 'X-Ray', 'Emergency Care', 'Health Packages'],
  gym: ['Monthly Membership', 'Personal Training', 'Zumba Class', 'Steam Bath', 'Diet Plan'],
  construction: ['Residential Construction', 'Commercial Building', 'Renovation', 'Interior Finishing', 'Structural Repair'],
  contractor: ['House Construction', 'Renovation', 'Flooring', 'Painting', 'Plumbing & Electrical'],
  plumbing: ['Pipe Fitting', 'Leak Repair', 'Bathroom Installation', 'Water Tank Setup', 'Drain Cleaning'],
  plumber: ['Pipe Fitting', 'Leak Repair', 'Bathroom Installation', 'Water Tank Setup', 'Drain Cleaning'],
  electrician: ['Wiring & Rewiring', 'Fan & Light Installation', 'MCB & Fuse Repair', 'Inverter Setup', 'Safety Inspection'],
  electrical: ['House Wiring', 'Commercial Wiring', 'Appliance Repair', 'Solar Installation', 'Emergency Call-out'],
  bakery: ['Bread & Buns', 'Custom Cakes', 'Cookies & Pastries', 'Bulk Orders', 'Home Delivery'],
  coaching: ['Class 10 Tuition', 'Class 12 Tuition', 'JEE/NEET Prep', 'English Speaking', 'Competitive Exams'],
  tuition: ['Maths Tuition', 'Science Tuition', 'English Tuition', 'Homework Help', 'Exam Prep'],
  boutique: ['Custom Stitching', 'Alterations', 'Bridal Wear', 'Ready-made Suits', 'Embroidery'],
  tailoring: ['Shirt Stitching', 'Pant Stitching', 'Alterations', 'Uniform Stitching', 'Blouse Stitching'],
  pharmacy: ['Prescription Medicines', 'OTC Medicines', 'Health Supplements', 'Home Delivery', 'Doctor Consultation'],
  dental: ['Teeth Cleaning', 'Root Canal', 'Braces', 'Tooth Extraction', 'Teeth Whitening'],
  dentist: ['Teeth Cleaning', 'Root Canal', 'Braces', 'Tooth Extraction', 'Teeth Whitening'],
  photography: ['Wedding Photography', 'Pre-wedding Shoot', 'Portrait Session', 'Event Coverage', 'Photo Editing'],
  travel: ['Domestic Tour Packages', 'Flight Booking', 'Hotel Booking', 'Visa Assistance', 'Cab Rental'],
  real: ['Property Sale', 'Property Rent', 'Site Visit', 'Documentation Help', 'Property Valuation'],
  property: ['Buy Property', 'Rent Property', 'Commercial Space', 'Plot Sale', 'Property Management'],
  auto: ['Car Service', 'Oil Change', 'AC Repair', 'Denting & Painting', 'Tyre Replacement'],
  garage: ['Two-wheeler Service', 'Four-wheeler Service', 'Oil Change', 'Brake Repair', 'Pickup & Drop'],
  laundry: ['Wash & Iron', 'Dry Cleaning', 'Steam Press', 'Pickup & Delivery', 'Curtain Cleaning'],
  catering: ['Wedding Catering', 'Corporate Events', 'Birthday Parties', 'Tiffin Service', 'Live Counters'],
  pest: ['Cockroach Treatment', 'Termite Control', 'Rodent Control', 'Bed Bug Treatment', 'Annual AMC'],
  cleaning: ['Home Deep Cleaning', 'Office Cleaning', 'Sofa Cleaning', 'Bathroom Cleaning', 'Move-in Cleaning'],
  interior: ['Modular Kitchen', 'Wardrobe Design', 'False Ceiling', 'Home Renovation', '3D Design Consultation'],
  architect: ['House Plan Design', '3D Elevation', 'Vastu Consultation', 'Site Supervision', 'Renovation Planning'],
  lawyer: ['Legal Consultation', 'Property Documentation', 'Family Law', 'Business Contracts', 'Court Representation'],
  advocate: ['Legal Consultation', 'Property Documentation', 'Family Law', 'Business Contracts', 'Court Representation'],
  accounting: ['GST Filing', 'ITR Filing', 'Bookkeeping', 'Company Registration', 'Audit Services'],
  ca: ['GST Filing', 'ITR Filing', 'Bookkeeping', 'Company Registration', 'Audit Services'],
  mobile: ['Screen Replacement', 'Battery Replacement', 'Software Repair', 'Accessories Sale', 'Buyback'],
  electronics: ['TV Repair', 'Fridge Repair', 'Washing Machine Repair', 'AC Repair', 'Home Visit Service'],
  yoga: ['Group Classes', 'Personal Training', 'Online Sessions', 'Meditation', 'Weight Loss Program'],
  spa: ['Swedish Massage', 'Deep Tissue Massage', 'Facial', 'Body Scrub', 'Couples Package'],
  hotel: ['Room Booking', 'Banquet Hall', 'Conference Room', 'Room Service', 'Pickup & Drop'],
  hostel: ['Monthly Stay', 'Daily Stay', 'AC Rooms', 'Mess Facility', 'Laundry Service'],
  printing: ['Visiting Cards', 'Flex & Banner', 'Document Printing', 'Wedding Cards', 'Logo Design'],
  stationery: ['Office Supplies', 'School Supplies', 'Custom Printing', 'Bulk Orders', 'Home Delivery'],
  kirana: ['Grocery Home Delivery', 'Monthly Ration Pack', 'Bulk Orders', 'Credit Account', 'Same-day Delivery'],
  grocery: ['Home Delivery', 'Monthly Subscription', 'Fresh Vegetables', 'Dairy Products', 'Bulk Orders'],
  furniture: ['Custom Furniture', 'Sofa Repair', 'Mattress Sale', 'Office Furniture', 'Home Delivery'],
  car: ['Car Wash', 'Detailing', 'Ceramic Coating', 'Interior Cleaning', 'Monthly Subscription'],
  wedding: ['Wedding Planning', 'Decoration', 'Photography', 'Catering Coordination', 'Venue Booking'],
  event: ['Birthday Decoration', 'Corporate Events', 'Sound & Lights', 'Anchor/Host', 'Full Event Management'],
  insurance: ['Life Insurance', 'Health Insurance', 'Vehicle Insurance', 'Term Plan', 'Claim Assistance'],
  astrologer: ['Horoscope Reading', 'Kundli Matching', 'Vastu Consultation', 'Gemstone Advice', 'Online Consultation'],
  mechanic: ['General Repair', 'Engine Service', 'Brake Service', 'Oil Change', 'Breakdown Assistance'],
}

export function inferServicesForBusiness(businessType: string): string[] | null {
  const normalized = businessType.toLowerCase().trim()
  if (!normalized) return null

  if (SERVICE_MAP[normalized]) return SERVICE_MAP[normalized]

  for (const [keyword, services] of Object.entries(SERVICE_MAP)) {
    if (normalized.includes(keyword) || keyword.includes(normalized)) {
      return services
    }
  }

  const words = normalized.split(/[\s,/+-]+/).filter((w) => w.length > 2)
  for (const word of words) {
    for (const [keyword, services] of Object.entries(SERVICE_MAP)) {
      if (keyword.includes(word) || word.includes(keyword)) return services
    }
  }

  return null
}

export function formatBusinessLabel(businessType: string): string {
  const t = businessType.trim()
  if (!t) return 'business'
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export function estimateMarketRates(services: string[], location: string) {
  const loc = location.toLowerCase()
  const tier =
    loc.includes('mumbai') || loc.includes('delhi') || loc.includes('bangalore') || loc.includes('bengaluru')
      ? 1.4
      : loc.includes('pune') || loc.includes('hyderabad') || loc.includes('chennai') || loc.includes('kolkata')
        ? 1.2
        : loc.includes('indore') || loc.includes('jaipur') || loc.includes('lucknow') || loc.includes('nagpur')
          ? 1.0
          : 0.9

  const constructionBoost = services.some((s) =>
    /construction|renovation|building|structural|commercial/i.test(s)
  )
    ? 8
    : 1

  return services.map((service, i) => {
    const base = Math.round((200 + i * 120) * tier * constructionBoost)
    return {
      service,
      min: Math.round(base * 0.75),
      max: Math.round(base * 1.35),
      suggested: base,
    }
  })
}
