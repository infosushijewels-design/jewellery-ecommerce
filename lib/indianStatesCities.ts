/**
 * Indian states and union territories with their major cities, used by the State / City dropdowns on checkout and in
 * the account address book. The list of cities is not meant to be complete — every state ends with "Other", which
 * lets the customer type any town or village not listed.
 *
 * The State must be one of these names (checked on the server too). The City is free text once chosen, so "Other"
 * is only a menu entry, never a stored value.
 */
export const OTHER_CITY = 'Other';

const cities = (...names: string[]) => [...names, OTHER_CITY];

export const INDIAN_STATES_AND_CITIES: Record<string, string[]> = {
  // ---- 28 states
  'Andhra Pradesh': cities('Visakhapatnam', 'Vijayawada', 'Guntur', 'Nellore', 'Tirupati', 'Kurnool', 'Rajahmundry', 'Kakinada', 'Kadapa', 'Anantapur'),
  'Arunachal Pradesh': cities('Itanagar', 'Naharlagun', 'Pasighat', 'Tawang', 'Ziro', 'Bomdila', 'Tezu', 'Along', 'Roing'),
  Assam: cities('Guwahati', 'Silchar', 'Dibrugarh', 'Jorhat', 'Nagaon', 'Tinsukia', 'Tezpur', 'Bongaigaon'),
  Bihar: cities('Patna', 'Gaya', 'Bhagalpur', 'Muzaffarpur', 'Purnia', 'Darbhanga', 'Arrah', 'Begusarai', 'Katihar'),
  Chhattisgarh: cities('Raipur', 'Bhilai', 'Bilaspur', 'Korba', 'Durg', 'Rajnandgaon', 'Raigarh', 'Jagdalpur'),
  Goa: cities('Panaji', 'Margao', 'Vasco da Gama', 'Mapusa', 'Ponda', 'Bicholim'),
  Gujarat: cities('Ahmedabad', 'Surat', 'Vadodara', 'Rajkot', 'Bhavnagar', 'Jamnagar', 'Gandhinagar', 'Junagadh', 'Anand', 'Morbi'),
  Haryana: cities('Gurugram', 'Faridabad', 'Panipat', 'Ambala', 'Karnal', 'Hisar', 'Rohtak', 'Sonipat', 'Panchkula', 'Yamunanagar'),
  'Himachal Pradesh': cities('Shimla', 'Dharamshala', 'Solan', 'Mandi', 'Kullu', 'Manali', 'Palampur', 'Hamirpur'),
  Jharkhand: cities('Ranchi', 'Jamshedpur', 'Dhanbad', 'Bokaro Steel City', 'Hazaribagh', 'Deoghar', 'Giridih'),
  Karnataka: cities('Bengaluru', 'Mysuru', 'Hubballi', 'Mangaluru', 'Belagavi', 'Kalaburagi', 'Davanagere', 'Ballari', 'Shivamogga', 'Udupi'),
  Kerala: cities('Thiruvananthapuram', 'Kochi', 'Kozhikode', 'Thrissur', 'Kollam', 'Kannur', 'Alappuzha', 'Palakkad', 'Kottayam'),
  'Madhya Pradesh': cities('Indore', 'Bhopal', 'Jabalpur', 'Gwalior', 'Ujjain', 'Sagar', 'Dewas', 'Satna', 'Ratlam', 'Rewa'),
  Maharashtra: cities('Mumbai', 'Pune', 'Nagpur', 'Thane', 'Nashik', 'Aurangabad', 'Solapur', 'Kolhapur', 'Navi Mumbai', 'Amravati', 'Pimpri-Chinchwad', 'Kalyan-Dombivli', 'Vasai-Virar'),
  Manipur: cities('Imphal', 'Thoubal', 'Bishnupur', 'Churachandpur', 'Kakching'),
  Meghalaya: cities('Shillong', 'Tura', 'Jowai', 'Nongstoin'),
  Mizoram: cities('Aizawl', 'Lunglei', 'Champhai', 'Serchhip'),
  Nagaland: cities('Kohima', 'Dimapur', 'Mokokchung', 'Tuensang', 'Wokha'),
  Odisha: cities('Bhubaneswar', 'Cuttack', 'Rourkela', 'Berhampur', 'Sambalpur', 'Puri', 'Balasore'),
  Punjab: cities('Ludhiana', 'Amritsar', 'Jalandhar', 'Patiala', 'Bathinda', 'Mohali', 'Pathankot', 'Hoshiarpur'),
  Rajasthan: cities('Jaipur', 'Jodhpur', 'Udaipur', 'Kota', 'Bikaner', 'Ajmer', 'Alwar', 'Bhilwara', 'Sikar', 'Bharatpur'),
  Sikkim: cities('Gangtok', 'Namchi', 'Gyalshing', 'Mangan'),
  'Tamil Nadu': cities('Chennai', 'Coimbatore', 'Madurai', 'Tiruchirappalli', 'Salem', 'Tiruppur', 'Erode', 'Vellore', 'Tirunelveli', 'Thoothukudi'),
  Telangana: cities('Hyderabad', 'Secunderabad', 'Warangal', 'Nizamabad', 'Karimnagar', 'Khammam', 'Ramagundam', 'Mahbubnagar'),
  Tripura: cities('Agartala', 'Dharmanagar', 'Kailasahar', 'Belonia', 'Ambassa'),
  'Uttar Pradesh': cities('Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Noida', 'Ghaziabad', 'Prayagraj', 'Meerut', 'Bareilly', 'Aligarh', 'Moradabad', 'Gorakhpur'),
  Uttarakhand: cities('Dehradun', 'Haridwar', 'Roorkee', 'Haldwani', 'Rudrapur', 'Kashipur', 'Rishikesh', 'Nainital'),
  'West Bengal': cities('Kolkata', 'Howrah', 'Durgapur', 'Asansol', 'Siliguri', 'Bardhaman', 'Kharagpur', 'Darjeeling'),

  // ---- 8 union territories
  'Andaman and Nicobar Islands': cities('Port Blair', 'Diglipur', 'Rangat', 'Mayabunder'),
  Chandigarh: cities('Chandigarh'),
  'Dadra and Nagar Haveli and Daman and Diu': cities('Silvassa', 'Daman', 'Diu', 'Amli'),
  Delhi: cities('New Delhi', 'North Delhi', 'South Delhi', 'East Delhi', 'West Delhi', 'Central Delhi', 'Dwarka', 'Rohini'),
  'Jammu and Kashmir': cities('Srinagar', 'Jammu', 'Anantnag', 'Baramulla', 'Udhampur', 'Kathua', 'Sopore'),
  Ladakh: cities('Leh', 'Kargil'),
  Lakshadweep: cities('Kavaratti', 'Agatti', 'Minicoy', 'Amini'),
  Puducherry: cities('Puducherry', 'Karaikal', 'Yanam', 'Mahe'),
};

/** Every state / union territory, alphabetically. */
export const INDIAN_STATES: string[] = Object.keys(INDIAN_STATES_AND_CITIES).sort((a, b) => a.localeCompare(b));

/** Older or alternative spellings people (and earlier saved addresses) use → the name in the list. */
const STATE_ALIASES: Record<string, string> = {
  orissa: 'Odisha',
  uttaranchal: 'Uttarakhand',
  pondicherry: 'Puducherry',
  'nct of delhi': 'Delhi',
  'delhi ncr': 'Delhi',
  'new delhi': 'Delhi',
  'jammu & kashmir': 'Jammu and Kashmir',
  'jammu kashmir': 'Jammu and Kashmir',
  'andaman & nicobar islands': 'Andaman and Nicobar Islands',
  'andaman and nicobar': 'Andaman and Nicobar Islands',
  'dadra & nagar haveli and daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
  'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
};

const norm = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const STATE_BY_NORMALISED = new Map(INDIAN_STATES.map((s) => [norm(s), s]));

/** The listed name for a state however it was typed ("maharashtra", "Orissa"…), or null if it is not an Indian state. */
export function canonicalState(value: string | null | undefined): string | null {
  if (!value) return null;
  const key = norm(value);
  return STATE_BY_NORMALISED.get(key) ?? STATE_ALIASES[key] ?? null;
}

/** The dropdown's cities for a state (ending with "Other"); empty when the state is not recognised. */
export function citiesForState(state: string | null | undefined): string[] {
  const canonical = canonicalState(state);
  return canonical ? INDIAN_STATES_AND_CITIES[canonical] : [];
}

/** True when `city` is one of the named cities listed for the state ("Other" is not a city). */
export function isListedCity(state: string, city: string): boolean {
  const wanted = norm(city);
  return citiesForState(state).some((c) => c !== OTHER_CITY && norm(c) === wanted);
}

/** The listed spelling of a city for the state (so "mumbai" is stored as "Mumbai"), or the city as typed. */
export function canonicalCity(state: string, city: string): string {
  const wanted = norm(city);
  return citiesForState(state).find((c) => c !== OTHER_CITY && norm(c) === wanted) ?? city.trim();
}
