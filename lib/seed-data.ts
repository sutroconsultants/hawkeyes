// HawkEye Water Utility Demo Data Seed Script
// This creates realistic water utility data for demonstration
// Note: This is fictional data for demonstration purposes

export const seedStatements: string[] = [];

// ============================================================================
// CREATE TABLES
// ============================================================================

seedStatements.push(`
CREATE DATABASE IF NOT EXISTS hawkeye
`);

// Pressure Zones
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.pressure_zones (
  zone_id String,
  zone_name String,
  min_pressure Float32,
  max_pressure Float32,
  elevation_range String,
  service_area String,
  population_served UInt32,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY zone_id
`);

// Critical Users (hospitals, schools, nursing homes)
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.critical_users (
  facility_id String,
  facility_name String,
  facility_type Enum8('hospital' = 1, 'school' = 2, 'nursing_home' = 3, 'fire_station' = 4, 'government' = 5),
  address String,
  city String,
  pressure_zone String,
  contact_name String,
  contact_phone String,
  contact_email String,
  priority_level Enum8('critical' = 1, 'high' = 2, 'medium' = 3),
  notes String,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY facility_id
`);

// Hydrants
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.hydrants (
  hydrant_id String,
  location_address String,
  cross_street String,
  city String,
  latitude Float64,
  longitude Float64,
  pressure_zone String,
  installation_date Date,
  manufacturer String,
  model String,
  hydrant_type Enum8('single' = 1, 'double' = 2, 'triple' = 3),
  barrel_size String,
  main_size String,
  status Enum8('active' = 1, 'inactive' = 2, 'out_of_service' = 3, 'abandoned' = 4),
  last_inspection_date Date,
  last_flow_test_date Date,
  static_pressure Float32,
  residual_pressure Float32,
  flow_rate Float32,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY hydrant_id
`);

// Hydrant Inspections
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.hydrant_inspections (
  inspection_id String,
  hydrant_id String,
  inspection_date Date,
  inspection_type Enum8('routine' = 1, 'annual' = 2, 'flow_test' = 3, 'complaint' = 4, 'post_repair' = 5),
  inspector_name String,
  inspector_id String,
  result Enum8('pass' = 1, 'fail' = 2, 'needs_repair' = 3, 'deferred' = 4),
  static_pressure Float32,
  residual_pressure Float32,
  flow_rate Float32,
  condition_rating UInt8,
  caps_condition String,
  nozzles_condition String,
  paint_condition String,
  operating_nut_condition String,
  drain_condition String,
  notes String,
  follow_up_required UInt8,
  work_order_created String,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (hydrant_id, inspection_date)
`);

// Valves
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.valves (
  valve_id String,
  location_address String,
  cross_street String,
  city String,
  latitude Float64,
  longitude Float64,
  pressure_zone String,
  installation_date Date,
  manufacturer String,
  valve_type Enum8('gate' = 1, 'butterfly' = 2, 'check' = 3, 'pressure_reducing' = 4, 'air_release' = 5, 'blow_off' = 6),
  valve_size String,
  main_id String,
  turns_to_close UInt16,
  normal_position Enum8('open' = 1, 'closed' = 2),
  status Enum8('active' = 1, 'inactive' = 2, 'stuck' = 3, 'broken' = 4, 'abandoned' = 5),
  criticality Enum8('critical' = 1, 'high' = 2, 'medium' = 3, 'low' = 4),
  last_exercise_date Date,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY valve_id
`);

// Valve Exercises
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.valve_exercises (
  exercise_id String,
  valve_id String,
  exercise_date Date,
  crew_id String,
  crew_members Array(String),
  turns_achieved UInt16,
  turns_expected UInt16,
  result Enum8('full_operation' = 1, 'partial_operation' = 2, 'stuck' = 3, 'broken' = 4, 'not_found' = 5),
  condition_rating UInt8,
  torque_required String,
  box_condition String,
  stem_condition String,
  notes String,
  follow_up_required UInt8,
  work_order_created String,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (valve_id, exercise_date)
`);

// Water Mains
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.mains (
  main_id String,
  start_location String,
  end_location String,
  street_name String,
  city String,
  pressure_zone String,
  installation_date Date,
  material Enum8('cast_iron' = 1, 'ductile_iron' = 2, 'steel' = 3, 'pvc' = 4, 'hdpe' = 5, 'concrete' = 6, 'asbestos_cement' = 7),
  diameter String,
  length_ft Float32,
  depth_ft Float32,
  lining_type String,
  status Enum8('active' = 1, 'inactive' = 2, 'abandoned' = 3),
  break_history_count UInt16,
  last_break_date Nullable(Date),
  condition_score UInt8,
  replacement_priority Enum8('immediate' = 1, 'high' = 2, 'medium' = 3, 'low' = 4, 'monitor' = 5),
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY main_id
`);

// Main Breaks
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.main_breaks (
  break_id String,
  main_id String,
  break_date DateTime,
  reported_by String,
  report_method Enum8('customer_call' = 1, 'crew_discovery' = 2, 'sensor_alert' = 3, 'contractor' = 4, 'city_agency' = 5),
  location_address String,
  city String,
  latitude Float64,
  longitude Float64,
  break_type Enum8('circumferential' = 1, 'longitudinal' = 2, 'joint_failure' = 3, 'corrosion_hole' = 4, 'service_connection' = 5, 'fitting_failure' = 6),
  cause Enum8('corrosion' = 1, 'age' = 2, 'ground_movement' = 3, 'third_party_damage' = 4, 'pressure_surge' = 5, 'temperature' = 6, 'unknown' = 7),
  estimated_gallons_lost UInt32,
  customers_affected UInt16,
  repair_start DateTime,
  repair_end DateTime,
  repair_crew_id String,
  repair_method String,
  repair_materials String,
  road_damage UInt8,
  property_damage UInt8,
  claim_filed UInt8,
  total_repair_cost Float32,
  notes String,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (main_id, break_date)
`);

// Work Orders
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.work_orders (
  work_order_id String,
  asset_type Enum8('hydrant' = 1, 'valve' = 2, 'main' = 3, 'service' = 4, 'meter' = 5, 'other' = 6),
  asset_id String,
  work_type Enum8('repair' = 1, 'replacement' = 2, 'inspection' = 3, 'maintenance' = 4, 'emergency' = 5, 'installation' = 6),
  priority Enum8('emergency' = 1, 'urgent' = 2, 'high' = 3, 'medium' = 4, 'low' = 5),
  status Enum8('open' = 1, 'assigned' = 2, 'in_progress' = 3, 'completed' = 4, 'cancelled' = 5, 'on_hold' = 6),
  description String,
  location_address String,
  city String,
  requested_by String,
  requested_date DateTime,
  assigned_crew String,
  assigned_date Nullable(DateTime),
  scheduled_date Nullable(DateTime),
  started_date Nullable(DateTime),
  completed_date Nullable(DateTime),
  labor_hours Float32,
  material_cost Float32,
  equipment_cost Float32,
  total_cost Float32,
  completion_notes String,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (work_order_id, requested_date)
`);

// Documents / Attachments
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.documents (
  document_id String,
  document_type Enum8('as_built' = 1, 'inspection_report' = 2, 'photo' = 3, 'video' = 4, 'permit' = 5, 'contract' = 6, 'drawing' = 7, 'scan' = 8, 'other' = 9),
  title String,
  description String,
  file_name String,
  file_path String,
  file_size_bytes UInt32,
  mime_type String,
  asset_type Nullable(String),
  asset_id Nullable(String),
  work_order_id Nullable(String),
  main_break_id Nullable(String),
  source_system String,
  uploaded_by String,
  upload_date DateTime,
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (document_id, upload_date)
`);

// Claims
seedStatements.push(`
CREATE TABLE IF NOT EXISTS hawkeye.claims (
  claim_id String,
  main_break_id String,
  claimant_name String,
  claimant_address String,
  claimant_phone String,
  claimant_email String,
  claim_date Date,
  incident_date Date,
  claim_type Enum8('property_damage' = 1, 'vehicle_damage' = 2, 'personal_injury' = 3, 'business_interruption' = 4, 'landscaping' = 5),
  damage_description String,
  claimed_amount Float32,
  approved_amount Nullable(Float32),
  status Enum8('submitted' = 1, 'under_review' = 2, 'approved' = 3, 'denied' = 4, 'settled' = 5, 'closed' = 6),
  adjuster_name String,
  adjuster_notes String,
  resolution_date Nullable(Date),
  created_at DateTime DEFAULT now()
) ENGINE = MergeTree()
ORDER BY (claim_id, claim_date)
`);

// ============================================================================
// INSERT DATA
// ============================================================================

// Pressure Zones
seedStatements.push(`
INSERT INTO hawkeye.pressure_zones (zone_id, zone_name, min_pressure, max_pressure, elevation_range, service_area, population_served) VALUES
('PZ-001', 'Oakland Hills High', 45, 80, '800-1200 ft', 'Oakland Hills, Montclair', 25000),
('PZ-002', 'Oakland Hills Mid', 50, 85, '400-800 ft', 'Upper Rockridge, Piedmont Ave', 45000),
('PZ-003', 'Oakland Flatlands', 55, 90, '0-400 ft', 'Downtown Oakland, Lake Merritt', 120000),
('PZ-004', 'Temescal Zone', 50, 80, '100-500 ft', 'Temescal, Rockridge', 35000),
('PZ-005', 'Fruitvale Zone', 55, 85, '0-200 ft', 'Fruitvale, San Antonio', 65000),
('PZ-006', 'West Oakland Zone', 60, 95, '0-100 ft', 'West Oakland, Emeryville Border', 40000),
('PZ-007', 'East Oakland Zone', 55, 90, '0-300 ft', 'East Oakland, Coliseum Area', 85000),
('PZ-008', 'Berkeley Hills', 45, 75, '600-1000 ft', 'Berkeley Hills, Claremont', 30000),
('PZ-009', 'North Berkeley', 50, 85, '100-400 ft', 'North Berkeley, Solano Ave', 42000),
('PZ-010', 'Albany Zone', 55, 90, '0-200 ft', 'Albany, El Cerrito Border', 28000)
`);

// Critical Users
seedStatements.push(`
INSERT INTO hawkeye.critical_users (facility_id, facility_name, facility_type, address, city, pressure_zone, contact_name, contact_phone, contact_email, priority_level, notes) VALUES
('CU-001', 'Highland Hospital', 'hospital', '1411 E 31st St', 'Oakland', 'PZ-005', 'James Chen', '510-437-4800', 'jchen@alamedahealthsystem.org', 'critical', 'Level 1 Trauma Center - requires 24/7 water supply'),
('CU-002', 'Kaiser Permanente Oakland', 'hospital', '3600 Broadway', 'Oakland', 'PZ-003', 'Maria Santos', '510-752-1000', 'maria.santos@kp.org', 'critical', 'Major medical center with dialysis unit'),
('CU-003', 'UCSF Benioff Children\\'s Hospital', 'hospital', '747 52nd St', 'Oakland', 'PZ-004', 'Robert Kim', '510-428-3000', 'rkim@ucsf.edu', 'critical', 'Pediatric trauma center'),
('CU-004', 'Alta Bates Summit Medical', 'hospital', '2450 Ashby Ave', 'Berkeley', 'PZ-009', 'Susan Park', '510-204-4444', 'spark@sutterhealth.org', 'critical', 'Regional medical center'),
('CU-005', 'Oakland Tech High School', 'school', '4351 Broadway', 'Oakland', 'PZ-004', 'Principal Williams', '510-879-3050', 'pwilliams@ousd.org', 'high', 'Large high school - 2000+ students'),
('CU-006', 'Skyline High School', 'school', '12250 Skyline Blvd', 'Oakland', 'PZ-001', 'Principal Johnson', '510-482-7808', 'mjohnson@ousd.org', 'high', 'Hills location - single water feed'),
('CU-007', 'Berkeley High School', 'school', '1980 Allston Way', 'Berkeley', 'PZ-009', 'Principal Garcia', '510-644-6121', 'agarcia@berkeley.net', 'high', 'Largest high school in district'),
('CU-008', 'Piedmont Gardens', 'nursing_home', '110 41st St', 'Oakland', 'PZ-004', 'Admin Director Lee', '510-654-7786', 'dlee@piedmontgardens.org', 'critical', 'Senior care facility - 200 residents'),
('CU-009', 'Merritt Manor', 'nursing_home', '1320 E 28th St', 'Oakland', 'PZ-003', 'Nancy Thompson', '510-534-8780', 'nthompson@merrittmanor.com', 'critical', 'Skilled nursing facility'),
('CU-010', 'Oakland Fire Station 1', 'fire_station', '1603 Martin Luther King Jr Way', 'Oakland', 'PZ-003', 'Captain Rodriguez', '510-238-3856', 'frodriguez@oaklandca.gov', 'critical', 'Downtown fire station'),
('CU-011', 'Oakland Fire Station 8', 'fire_station', '463 51st St', 'Oakland', 'PZ-004', 'Captain Lee', '510-238-3856', 'jlee@oaklandca.gov', 'critical', 'Temescal area coverage'),
('CU-012', 'Berkeley Fire Station 2', 'fire_station', '2442 Ninth St', 'Berkeley', 'PZ-009', 'Captain Martinez', '510-981-3473', 'hmartinez@berkeleyca.gov', 'critical', 'West Berkeley coverage'),
('CU-013', 'Oakland City Hall', 'government', '1 Frank H. Ogawa Plaza', 'Oakland', 'PZ-003', 'Facilities Manager', '510-238-3141', 'facilities@oaklandca.gov', 'high', 'Emergency operations center'),
('CU-014', 'Alameda County Courthouse', 'government', '1225 Fallon St', 'Oakland', 'PZ-003', 'Building Manager', '510-268-7600', 'courtfacilities@alameda.courts.ca.gov', 'high', 'County operations'),
('CU-015', 'Claremont Middle School', 'school', '5750 College Ave', 'Oakland', 'PZ-002', 'Principal Adams', '510-879-1010', 'sadams@ousd.org', 'medium', 'Middle school - 800 students')
`);

// Generate Oakland street data for realistic addresses
const oaklandStreets = [
  'Broadway', 'Telegraph Ave', 'Grand Ave', 'MacArthur Blvd', 'Piedmont Ave',
  'College Ave', 'Shattuck Ave', 'San Pablo Ave', 'International Blvd', 'Fruitvale Ave',
  'High St', '14th St', 'Park Blvd', 'Lakeshore Ave', 'Harrison St',
  'Webster St', 'Oak St', 'Madison St', 'Jackson St', 'Alice St',
  'Franklin St', 'Clay St', 'Washington St', 'Martin Luther King Jr Way', 'Market St',
  'Adeline St', 'Mandela Pkwy', '40th St', '51st St', 'Claremont Ave'
];

const cities = ['Oakland', 'Berkeley', 'Emeryville', 'Albany'];
const pressureZones = ['PZ-001', 'PZ-002', 'PZ-003', 'PZ-004', 'PZ-005', 'PZ-006', 'PZ-007', 'PZ-008', 'PZ-009', 'PZ-010'];
const manufacturers = ['Mueller Co', 'American AVK', 'Kennedy Valve', 'Clow Valve', 'M&H Valve'];
const inspectors = ['John Martinez', 'Sarah Chen', 'Mike Thompson', 'Lisa Wong', 'Carlos Rivera', 'Amy Johnson', 'David Kim', 'Rachel Brown'];
const crews = ['Crew-A1', 'Crew-A2', 'Crew-B1', 'Crew-B2', 'Crew-C1', 'Crew-C2', 'Crew-D1', 'Crew-E1'];

// Generate Hydrants (5000 hydrants)
let hydrantInserts: string[] = [];
for (let i = 1; i <= 5000; i++) {
  const id = `HYD-${String(i).padStart(4, '0')}`;
  const streetNum = Math.floor(Math.random() * 9000) + 100;
  const street = oaklandStreets[Math.floor(Math.random() * oaklandStreets.length)];
  const crossStreet = oaklandStreets[Math.floor(Math.random() * oaklandStreets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const lat = 37.78 + (Math.random() * 0.1);
  const lng = -122.27 + (Math.random() * 0.1);
  const zone = pressureZones[Math.floor(Math.random() * pressureZones.length)];
  const installYear = 1960 + Math.floor(Math.random() * 60);
  const installMonth = Math.floor(Math.random() * 12) + 1;
  const installDay = Math.floor(Math.random() * 28) + 1;
  const mfg = manufacturers[Math.floor(Math.random() * manufacturers.length)];
  const model = ['Centurion', 'Mark 73', 'Reliant', 'Guardian', 'Series 2500'][Math.floor(Math.random() * 5)];
  const hType = Math.floor(Math.random() * 3) + 1;
  const barrelSize = ['5.25"', '6"', '7"'][Math.floor(Math.random() * 3)];
  const mainSize = ['6"', '8"', '10"', '12"'][Math.floor(Math.random() * 4)];
  const status = Math.random() > 0.05 ? 1 : (Math.random() > 0.5 ? 2 : 3);
  const lastInspYear = 2020 + Math.floor(Math.random() * 6);
  const lastInspMonth = Math.floor(Math.random() * 12) + 1;
  const lastInspDay = Math.floor(Math.random() * 28) + 1;
  const staticPressure = 50 + Math.floor(Math.random() * 40);
  const residualPressure = 30 + Math.floor(Math.random() * 30);
  const flowRate = 800 + Math.floor(Math.random() * 1200);

  hydrantInserts.push(`('${id}', '${streetNum} ${street}', '${crossStreet}', '${city}', ${lat.toFixed(6)}, ${lng.toFixed(6)}, '${zone}', '${installYear}-${String(installMonth).padStart(2, '0')}-${String(installDay).padStart(2, '0')}', '${mfg}', '${model}', ${hType}, '${barrelSize}', '${mainSize}', ${status}, '${lastInspYear}-${String(lastInspMonth).padStart(2, '0')}-${String(lastInspDay).padStart(2, '0')}', '${lastInspYear}-${String(lastInspMonth).padStart(2, '0')}-${String(lastInspDay).padStart(2, '0')}', ${staticPressure}, ${residualPressure}, ${flowRate})`);
}

// Split hydrant inserts into chunks
for (let i = 0; i < hydrantInserts.length; i += 100) {
  const chunk = hydrantInserts.slice(i, i + 100);
  seedStatements.push(`
INSERT INTO hawkeye.hydrants (hydrant_id, location_address, cross_street, city, latitude, longitude, pressure_zone, installation_date, manufacturer, model, hydrant_type, barrel_size, main_size, status, last_inspection_date, last_flow_test_date, static_pressure, residual_pressure, flow_rate) VALUES
${chunk.join(',\n')}
`);
}

// Generate Hydrant Inspections (10 years of history, ~50000 inspections)
let inspectionInserts: string[] = [];
for (let i = 1; i <= 50000; i++) {
  const id = `INS-${String(i).padStart(6, '0')}`;
  const hydrantNum = Math.floor(Math.random() * 5000) + 1;
  const hydrantId = `HYD-${String(hydrantNum).padStart(4, '0')}`;
  const year = 2016 + Math.floor(Math.random() * 10);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const inspType = Math.floor(Math.random() * 5) + 1;
  const inspector = inspectors[Math.floor(Math.random() * inspectors.length)];
  const inspectorId = `EMP-${String(Math.floor(Math.random() * 50) + 100).padStart(3, '0')}`;
  const resultRand = Math.random();
  const result = resultRand > 0.15 ? 1 : (resultRand > 0.05 ? 3 : 2);
  const staticPressure = 50 + Math.floor(Math.random() * 40);
  const residualPressure = 30 + Math.floor(Math.random() * 30);
  const flowRate = 800 + Math.floor(Math.random() * 1200);
  const conditionRating = Math.floor(Math.random() * 3) + 3;
  const capsCondition = ['Good', 'Fair', 'Needs Paint', 'Damaged'][Math.floor(Math.random() * 4)];
  const nozzlesCondition = ['Good', 'Fair', 'Corroded', 'Needs Replacement'][Math.floor(Math.random() * 4)];
  const paintCondition = ['Good', 'Fair', 'Faded', 'Peeling'][Math.floor(Math.random() * 4)];
  const operatingNutCondition = ['Good', 'Stiff', 'Needs Lubrication'][Math.floor(Math.random() * 3)];
  const drainCondition = ['Good', 'Slow', 'Blocked'][Math.floor(Math.random() * 3)];
  const notes = ['Routine inspection completed', 'All components functional', 'Minor wear observed', 'Scheduled for painting', 'Flow test satisfactory', ''][Math.floor(Math.random() * 6)];
  const followUp = result === 1 ? 0 : 1;
  const workOrder = followUp ? `WO-${String(Math.floor(Math.random() * 25000) + 1).padStart(6, '0')}` : '';

  inspectionInserts.push(`('${id}', '${hydrantId}', '${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}', ${inspType}, '${inspector}', '${inspectorId}', ${result}, ${staticPressure}, ${residualPressure}, ${flowRate}, ${conditionRating}, '${capsCondition}', '${nozzlesCondition}', '${paintCondition}', '${operatingNutCondition}', '${drainCondition}', '${notes}', ${followUp}, '${workOrder}')`);
}

for (let i = 0; i < inspectionInserts.length; i += 100) {
  const chunk = inspectionInserts.slice(i, i + 100);
  seedStatements.push(`
INSERT INTO hawkeye.hydrant_inspections (inspection_id, hydrant_id, inspection_date, inspection_type, inspector_name, inspector_id, result, static_pressure, residual_pressure, flow_rate, condition_rating, caps_condition, nozzles_condition, paint_condition, operating_nut_condition, drain_condition, notes, follow_up_required, work_order_created) VALUES
${chunk.join(',\n')}
`);
}

// Generate Valves (8000 valves)
let valveInserts: string[] = [];
for (let i = 1; i <= 8000; i++) {
  const id = `VLV-${String(i).padStart(4, '0')}`;
  const streetNum = Math.floor(Math.random() * 9000) + 100;
  const street = oaklandStreets[Math.floor(Math.random() * oaklandStreets.length)];
  const crossStreet = oaklandStreets[Math.floor(Math.random() * oaklandStreets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const lat = 37.78 + (Math.random() * 0.1);
  const lng = -122.27 + (Math.random() * 0.1);
  const zone = pressureZones[Math.floor(Math.random() * pressureZones.length)];
  const installYear = 1950 + Math.floor(Math.random() * 70);
  const installMonth = Math.floor(Math.random() * 12) + 1;
  const installDay = Math.floor(Math.random() * 28) + 1;
  const mfg = manufacturers[Math.floor(Math.random() * manufacturers.length)];
  const vType = Math.floor(Math.random() * 6) + 1;
  const vSize = ['4"', '6"', '8"', '10"', '12"', '16"', '20"'][Math.floor(Math.random() * 7)];
  const mainId = `MAIN-${String(Math.floor(Math.random() * 3000) + 1).padStart(4, '0')}`;
  const turnsToClose = 10 + Math.floor(Math.random() * 40);
  const normalPosition = Math.random() > 0.1 ? 1 : 2;
  const statusRand = Math.random();
  const status = statusRand > 0.1 ? 1 : (statusRand > 0.05 ? 3 : 4);
  const criticality = Math.floor(Math.random() * 4) + 1;
  const lastExerciseYear = 2018 + Math.floor(Math.random() * 8);
  const lastExerciseMonth = Math.floor(Math.random() * 12) + 1;
  const lastExerciseDay = Math.floor(Math.random() * 28) + 1;

  valveInserts.push(`('${id}', '${streetNum} ${street}', '${crossStreet}', '${city}', ${lat.toFixed(6)}, ${lng.toFixed(6)}, '${zone}', '${installYear}-${String(installMonth).padStart(2, '0')}-${String(installDay).padStart(2, '0')}', '${mfg}', ${vType}, '${vSize}', '${mainId}', ${turnsToClose}, ${normalPosition}, ${status}, ${criticality}, '${lastExerciseYear}-${String(lastExerciseMonth).padStart(2, '0')}-${String(lastExerciseDay).padStart(2, '0')}')`);
}

for (let i = 0; i < valveInserts.length; i += 100) {
  const chunk = valveInserts.slice(i, i + 100);
  seedStatements.push(`
INSERT INTO hawkeye.valves (valve_id, location_address, cross_street, city, latitude, longitude, pressure_zone, installation_date, manufacturer, valve_type, valve_size, main_id, turns_to_close, normal_position, status, criticality, last_exercise_date) VALUES
${chunk.join(',\n')}
`);
}

// Generate Valve Exercises (10 years of history, ~80000 exercises)
let exerciseInserts: string[] = [];
for (let i = 1; i <= 80000; i++) {
  const id = `EXE-${String(i).padStart(6, '0')}`;
  const valveNum = Math.floor(Math.random() * 8000) + 1;
  const valveId = `VLV-${String(valveNum).padStart(4, '0')}`;
  const year = 2016 + Math.floor(Math.random() * 10);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const crew = crews[Math.floor(Math.random() * crews.length)];
  const crewMember1 = inspectors[Math.floor(Math.random() * inspectors.length)];
  const crewMember2 = inspectors[Math.floor(Math.random() * inspectors.length)];
  const turnsExpected = 15 + Math.floor(Math.random() * 30);
  const resultRand = Math.random();
  const result = resultRand > 0.2 ? 1 : (resultRand > 0.1 ? 2 : (resultRand > 0.05 ? 3 : 4));
  const turnsAchieved = result === 1 ? turnsExpected : Math.floor(turnsExpected * (0.3 + Math.random() * 0.6));
  const conditionRating = result === 1 ? 4 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 2);
  const torque = ['Normal', 'High', 'Very High'][Math.floor(Math.random() * 3)];
  const boxCondition = ['Good', 'Fair', 'Damaged', 'Missing Lid'][Math.floor(Math.random() * 4)];
  const stemCondition = ['Good', 'Corroded', 'Bent', 'Broken'][Math.floor(Math.random() * 4)];
  const notes = ['Full operation verified', 'Valve exercised successfully', 'Some resistance noted', 'Requires follow-up', 'Lubrication applied', ''][Math.floor(Math.random() * 6)];
  const followUp = result === 1 ? 0 : 1;
  const workOrder = followUp ? `WO-${String(Math.floor(Math.random() * 25000) + 1).padStart(6, '0')}` : '';

  exerciseInserts.push(`('${id}', '${valveId}', '${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}', '${crew}', ['${crewMember1}', '${crewMember2}'], ${turnsAchieved}, ${turnsExpected}, ${result}, ${conditionRating}, '${torque}', '${boxCondition}', '${stemCondition}', '${notes}', ${followUp}, '${workOrder}')`);
}

for (let i = 0; i < exerciseInserts.length; i += 100) {
  const chunk = exerciseInserts.slice(i, i + 100);
  seedStatements.push(`
INSERT INTO hawkeye.valve_exercises (exercise_id, valve_id, exercise_date, crew_id, crew_members, turns_achieved, turns_expected, result, condition_rating, torque_required, box_condition, stem_condition, notes, follow_up_required, work_order_created) VALUES
${chunk.join(',\n')}
`);
}

// Generate Water Mains (3000 mains)
let mainInserts: string[] = [];
for (let i = 1; i <= 3000; i++) {
  const id = `MAIN-${String(i).padStart(4, '0')}`;
  const street = oaklandStreets[Math.floor(Math.random() * oaklandStreets.length)];
  const startNum = Math.floor(Math.random() * 4000) + 100;
  const endNum = startNum + Math.floor(Math.random() * 2000) + 200;
  const city = cities[Math.floor(Math.random() * cities.length)];
  const zone = pressureZones[Math.floor(Math.random() * pressureZones.length)];
  const installYear = 1920 + Math.floor(Math.random() * 100);
  const installMonth = Math.floor(Math.random() * 12) + 1;
  const installDay = Math.floor(Math.random() * 28) + 1;
  const material = installYear < 1970 ? (Math.random() > 0.3 ? 1 : 7) : (Math.random() > 0.5 ? 2 : 4);
  const diameter = ['4"', '6"', '8"', '10"', '12"', '16"', '20"', '24"'][Math.floor(Math.random() * 8)];
  const length = 200 + Math.floor(Math.random() * 2000);
  const depth = 3 + Math.floor(Math.random() * 4);
  const lining = ['Cement', 'Epoxy', 'None', 'Polyethylene'][Math.floor(Math.random() * 4)];
  const status = Math.random() > 0.05 ? 1 : 3;
  const breakCount = Math.floor(Math.random() * 8);
  const hasBreak = breakCount > 0;
  const lastBreakYear = hasBreak ? 2016 + Math.floor(Math.random() * 10) : null;
  const lastBreakMonth = hasBreak ? Math.floor(Math.random() * 12) + 1 : null;
  const lastBreakDay = hasBreak ? Math.floor(Math.random() * 28) + 1 : null;
  const conditionScore = Math.max(1, 10 - Math.floor((2026 - installYear) / 15) - breakCount);
  const priorityRand = Math.random();
  const priority = conditionScore < 3 ? 1 : (conditionScore < 5 ? 2 : (conditionScore < 7 ? 3 : (conditionScore < 9 ? 4 : 5)));

  const lastBreakDate = hasBreak ? `'${lastBreakYear}-${String(lastBreakMonth).padStart(2, '0')}-${String(lastBreakDay).padStart(2, '0')}'` : 'NULL';

  mainInserts.push(`('${id}', '${startNum} ${street}', '${endNum} ${street}', '${street}', '${city}', '${zone}', '${installYear}-${String(installMonth).padStart(2, '0')}-${String(installDay).padStart(2, '0')}', ${material}, '${diameter}', ${length}, ${depth}, '${lining}', ${status}, ${breakCount}, ${lastBreakDate}, ${conditionScore}, ${priority})`);
}

for (let i = 0; i < mainInserts.length; i += 100) {
  const chunk = mainInserts.slice(i, i + 100);
  seedStatements.push(`
INSERT INTO hawkeye.mains (main_id, start_location, end_location, street_name, city, pressure_zone, installation_date, material, diameter, length_ft, depth_ft, lining_type, status, break_history_count, last_break_date, condition_score, replacement_priority) VALUES
${chunk.join(',\n')}
`);
}

// Generate Main Breaks (2000 breaks over 10 years)
let breakInserts: string[] = [];
for (let i = 1; i <= 2000; i++) {
  const id = `BRK-${String(i).padStart(5, '0')}`;
  const mainNum = Math.floor(Math.random() * 3000) + 1;
  const mainId = `MAIN-${String(mainNum).padStart(4, '0')}`;
  const year = 2016 + Math.floor(Math.random() * 10);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const hour = Math.floor(Math.random() * 24);
  const minute = Math.floor(Math.random() * 60);
  const streetNum = Math.floor(Math.random() * 9000) + 100;
  const street = oaklandStreets[Math.floor(Math.random() * oaklandStreets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const lat = 37.78 + (Math.random() * 0.1);
  const lng = -122.27 + (Math.random() * 0.1);
  const reportedBy = ['Customer', 'Crew Member', 'City Inspector', 'Contractor', 'Police'][Math.floor(Math.random() * 5)];
  const reportMethod = Math.floor(Math.random() * 5) + 1;
  const breakType = Math.floor(Math.random() * 6) + 1;
  const cause = Math.floor(Math.random() * 7) + 1;
  const gallonsLost = 5000 + Math.floor(Math.random() * 500000);
  const customersAffected = 10 + Math.floor(Math.random() * 500);
  const repairStartHour = hour + 1 + Math.floor(Math.random() * 2);
  const repairEndHour = repairStartHour + 2 + Math.floor(Math.random() * 10);
  const crew = crews[Math.floor(Math.random() * crews.length)];
  const repairMethod = ['Clamp Repair', 'Full Circle Repair', 'Section Replacement', 'Joint Repair', 'Sleeve Installation'][Math.floor(Math.random() * 5)];
  const repairMaterials = ['Stainless Steel Clamp', 'Ductile Iron Pipe', 'Repair Coupling', 'Joint Kit', 'Full Circle Band'][Math.floor(Math.random() * 5)];
  const roadDamage = Math.random() > 0.6 ? 1 : 0;
  const propertyDamage = Math.random() > 0.7 ? 1 : 0;
  const claimFiled = propertyDamage && Math.random() > 0.5 ? 1 : 0;
  const repairCost = 2000 + Math.floor(Math.random() * 50000);
  const notes = ['Emergency repair completed', 'Main isolated and repaired', 'Temporary repair - permanent scheduled', 'Full section replacement required', 'Customer notified'][Math.floor(Math.random() * 5)];

  breakInserts.push(`('${id}', '${mainId}', '${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00', '${reportedBy}', ${reportMethod}, '${streetNum} ${street}', '${city}', ${lat.toFixed(6)}, ${lng.toFixed(6)}, ${breakType}, ${cause}, ${gallonsLost}, ${customersAffected}, '${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(repairStartHour % 24).padStart(2, '0')}:00:00', '${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(repairEndHour % 24).padStart(2, '0')}:00:00', '${crew}', '${repairMethod}', '${repairMaterials}', ${roadDamage}, ${propertyDamage}, ${claimFiled}, ${repairCost}, '${notes}')`);
}

for (let i = 0; i < breakInserts.length; i += 50) {
  const chunk = breakInserts.slice(i, i + 50);
  seedStatements.push(`
INSERT INTO hawkeye.main_breaks (break_id, main_id, break_date, reported_by, report_method, location_address, city, latitude, longitude, break_type, cause, estimated_gallons_lost, customers_affected, repair_start, repair_end, repair_crew_id, repair_method, repair_materials, road_damage, property_damage, claim_filed, total_repair_cost, notes) VALUES
${chunk.join(',\n')}
`);
}

// Generate Work Orders (25000 work orders)
let workOrderInserts: string[] = [];
for (let i = 1; i <= 25000; i++) {
  const id = `WO-${String(i).padStart(6, '0')}`;
  const assetType = Math.floor(Math.random() * 4) + 1;
  let assetId = '';
  if (assetType === 1) assetId = `HYD-${String(Math.floor(Math.random() * 5000) + 1).padStart(4, '0')}`;
  else if (assetType === 2) assetId = `VLV-${String(Math.floor(Math.random() * 8000) + 1).padStart(4, '0')}`;
  else if (assetType === 3) assetId = `MAIN-${String(Math.floor(Math.random() * 3000) + 1).padStart(4, '0')}`;
  else assetId = `SVC-${String(Math.floor(Math.random() * 10000) + 1).padStart(5, '0')}`;

  const workType = Math.floor(Math.random() * 5) + 1;
  const priority = Math.floor(Math.random() * 5) + 1;
  const statusRand = Math.random();
  const status = statusRand > 0.3 ? 4 : (statusRand > 0.15 ? 3 : (statusRand > 0.05 ? 2 : 1));
  const descriptions = [
    'Hydrant repair - leaking from stem',
    'Valve exercise required',
    'Main leak investigation',
    'Service line replacement',
    'Routine inspection',
    'Emergency repair',
    'Paint and maintenance',
    'Replace damaged components',
    'Flow test required',
    'Customer complaint follow-up'
  ];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  const streetNum = Math.floor(Math.random() * 9000) + 100;
  const street = oaklandStreets[Math.floor(Math.random() * oaklandStreets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const requestedBy = inspectors[Math.floor(Math.random() * inspectors.length)];
  const year = 2016 + Math.floor(Math.random() * 10);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const crew = crews[Math.floor(Math.random() * crews.length)];
  const laborHours = 1 + Math.floor(Math.random() * 16);
  const materialCost = Math.floor(Math.random() * 5000);
  const equipmentCost = Math.floor(Math.random() * 1000);
  const totalCost = laborHours * 85 + materialCost + equipmentCost;
  const completionNotes = status === 4 ? ['Work completed as specified', 'Repair successful', 'All tests passed', 'Asset returned to service'][Math.floor(Math.random() * 4)] : '';

  const assignedDate = status >= 2 ? `'${year}-${String(month).padStart(2, '0')}-${String(Math.min(day + 1, 28)).padStart(2, '0')} 08:00:00'` : 'NULL';
  const scheduledDate = status >= 2 ? `'${year}-${String(month).padStart(2, '0')}-${String(Math.min(day + 2, 28)).padStart(2, '0')} 08:00:00'` : 'NULL';
  const startedDate = status >= 3 ? `'${year}-${String(month).padStart(2, '0')}-${String(Math.min(day + 2, 28)).padStart(2, '0')} 09:00:00'` : 'NULL';
  const completedDate = status === 4 ? `'${year}-${String(month).padStart(2, '0')}-${String(Math.min(day + 3, 28)).padStart(2, '0')} 15:00:00'` : 'NULL';

  workOrderInserts.push(`('${id}', ${assetType}, '${assetId}', ${workType}, ${priority}, ${status}, '${description}', '${streetNum} ${street}', '${city}', '${requestedBy}', '${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 10:00:00', '${crew}', ${assignedDate}, ${scheduledDate}, ${startedDate}, ${completedDate}, ${laborHours}, ${materialCost}, ${equipmentCost}, ${totalCost}, '${completionNotes}')`);
}

for (let i = 0; i < workOrderInserts.length; i += 100) {
  const chunk = workOrderInserts.slice(i, i + 100);
  seedStatements.push(`
INSERT INTO hawkeye.work_orders (work_order_id, asset_type, asset_id, work_type, priority, status, description, location_address, city, requested_by, requested_date, assigned_crew, assigned_date, scheduled_date, started_date, completed_date, labor_hours, material_cost, equipment_cost, total_cost, completion_notes) VALUES
${chunk.join(',\n')}
`);
}

// Generate Documents (20000 documents)
let documentInserts: string[] = [];
const docTypes = ['as_built', 'inspection_report', 'photo', 'video', 'permit', 'contract', 'drawing', 'scan', 'other'];
for (let i = 1; i <= 20000; i++) {
  const id = `DOC-${String(i).padStart(6, '0')}`;
  const docTypeIdx = Math.floor(Math.random() * 9) + 1;
  const docTypeName = docTypes[docTypeIdx - 1];
  const titles = {
    1: ['As-Built Drawing', 'Construction Record', 'Installation Drawing', 'Field Notes'],
    2: ['Inspection Report', 'Annual Inspection', 'Flow Test Report', 'Condition Assessment'],
    3: ['Site Photo', 'Repair Photo', 'Before Photo', 'After Photo'],
    4: ['Repair Video', 'Inspection Video', 'Training Video'],
    5: ['Excavation Permit', 'Work Permit', 'Street Closure Permit'],
    6: ['Repair Contract', 'Maintenance Agreement', 'Service Contract'],
    7: ['System Drawing', 'Network Map', 'Detail Drawing'],
    8: ['Scanned Document', 'Historical Record', 'Mylar Scan'],
    9: ['Miscellaneous', 'Reference Document', 'Supporting Document']
  };
  const title = titles[docTypeIdx as keyof typeof titles][Math.floor(Math.random() * titles[docTypeIdx as keyof typeof titles].length)];
  const description = `${title} for asset record`;
  const extensions = { 1: 'pdf', 2: 'pdf', 3: 'jpg', 4: 'mp4', 5: 'pdf', 6: 'pdf', 7: 'dwg', 8: 'tif', 9: 'pdf' };
  const ext = extensions[docTypeIdx as keyof typeof extensions];
  const fileName = `${id}_${docTypeName}.${ext}`;
  const filePath = `/documents/${docTypeName}s/${fileName}`;
  const fileSize = 10000 + Math.floor(Math.random() * 10000000);
  const mimeTypes = { pdf: 'application/pdf', jpg: 'image/jpeg', mp4: 'video/mp4', dwg: 'application/acad', tif: 'image/tiff' };
  const mimeType = mimeTypes[ext as keyof typeof mimeTypes];

  const assetTypeRand = Math.random();
  let assetType = 'NULL';
  let assetId = 'NULL';
  let workOrderId = 'NULL';
  let mainBreakId = 'NULL';

  if (assetTypeRand > 0.6) {
    const types = ['hydrant', 'valve', 'main'];
    assetType = `'${types[Math.floor(Math.random() * types.length)]}'`;
    if (assetType === "'hydrant'") assetId = `'HYD-${String(Math.floor(Math.random() * 5000) + 1).padStart(4, '0')}'`;
    else if (assetType === "'valve'") assetId = `'VLV-${String(Math.floor(Math.random() * 8000) + 1).padStart(4, '0')}'`;
    else assetId = `'MAIN-${String(Math.floor(Math.random() * 3000) + 1).padStart(4, '0')}'`;
  } else if (assetTypeRand > 0.3) {
    workOrderId = `'WO-${String(Math.floor(Math.random() * 25000) + 1).padStart(6, '0')}'`;
  } else {
    mainBreakId = `'BRK-${String(Math.floor(Math.random() * 2000) + 1).padStart(5, '0')}'`;
  }

  const sourceSystem = ['Oracle Legacy', 'FileNet', 'SharePoint', 'Cold Fusion Export', 'Manual Upload'][Math.floor(Math.random() * 5)];
  const uploadedBy = inspectors[Math.floor(Math.random() * inspectors.length)];
  const year = 2016 + Math.floor(Math.random() * 10);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;

  documentInserts.push(`('${id}', ${docTypeIdx}, '${title}', '${description}', '${fileName}', '${filePath}', ${fileSize}, '${mimeType}', ${assetType}, ${assetId}, ${workOrderId}, ${mainBreakId}, '${sourceSystem}', '${uploadedBy}', '${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} 12:00:00')`);
}

for (let i = 0; i < documentInserts.length; i += 100) {
  const chunk = documentInserts.slice(i, i + 100);
  seedStatements.push(`
INSERT INTO hawkeye.documents (document_id, document_type, title, description, file_name, file_path, file_size_bytes, mime_type, asset_type, asset_id, work_order_id, main_break_id, source_system, uploaded_by, upload_date) VALUES
${chunk.join(',\n')}
`);
}

// Generate Claims (500 claims related to main breaks)
let claimInserts: string[] = [];
for (let i = 1; i <= 500; i++) {
  const id = `CLM-${String(i).padStart(5, '0')}`;
  const breakNum = Math.floor(Math.random() * 2000) + 1;
  const breakId = `BRK-${String(breakNum).padStart(5, '0')}`;
  const firstNames = ['John', 'Mary', 'Robert', 'Patricia', 'Michael', 'Jennifer', 'William', 'Linda', 'David', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const claimantName = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
  const streetNum = Math.floor(Math.random() * 9000) + 100;
  const street = oaklandStreets[Math.floor(Math.random() * oaklandStreets.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const claimantAddress = `${streetNum} ${street}, ${city}, CA`;
  const claimantPhone = `510-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}-${String(Math.floor(Math.random() * 9000) + 1000).padStart(4, '0')}`;
  const claimantEmail = `${claimantName.toLowerCase().replace(' ', '.')}@email.com`;
  const year = 2016 + Math.floor(Math.random() * 10);
  const month = Math.floor(Math.random() * 12) + 1;
  const day = Math.floor(Math.random() * 28) + 1;
  const claimType = Math.floor(Math.random() * 5) + 1;
  const damageDescriptions = [
    'Water damage to basement and personal property',
    'Vehicle damaged by water and debris',
    'Landscaping destroyed by flooding',
    'Business closed for 3 days due to water damage',
    'Foundation damage from water intrusion'
  ];
  const damageDescription = damageDescriptions[claimType - 1];
  const claimedAmount = 1000 + Math.floor(Math.random() * 50000);
  const statusRand = Math.random();
  const status = statusRand > 0.6 ? 5 : (statusRand > 0.4 ? 3 : (statusRand > 0.2 ? 4 : 2));
  const approvedAmount = status === 3 || status === 5 ? Math.floor(claimedAmount * (0.5 + Math.random() * 0.5)) : null;
  const adjusters = ['Thomas Wright', 'Sarah Miller', 'James Chen', 'Emily Davis'];
  const adjusterName = adjusters[Math.floor(Math.random() * adjusters.length)];
  const adjusterNotes = status === 4 ? 'Claim denied - damage not attributable to main break' : 'Claim reviewed and processed';
  const resolutionDate = status >= 3 ? `'${year}-${String(Math.min(month + 2, 12)).padStart(2, '0')}-${String(day).padStart(2, '0')}'` : 'NULL';
  const approvedAmountStr = approvedAmount ? approvedAmount.toString() : 'NULL';

  claimInserts.push(`('${id}', '${breakId}', '${claimantName}', '${claimantAddress}', '${claimantPhone}', '${claimantEmail}', '${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}', '${year}-${String(month).padStart(2, '0')}-${String(Math.max(day - 5, 1)).padStart(2, '0')}', ${claimType}, '${damageDescription}', ${claimedAmount}, ${approvedAmountStr}, ${status}, '${adjusterName}', '${adjusterNotes}', ${resolutionDate})`);
}

seedStatements.push(`
INSERT INTO hawkeye.claims (claim_id, main_break_id, claimant_name, claimant_address, claimant_phone, claimant_email, claim_date, incident_date, claim_type, damage_description, claimed_amount, approved_amount, status, adjuster_name, adjuster_notes, resolution_date) VALUES
${claimInserts.join(',\n')}
`);

export default seedStatements;
