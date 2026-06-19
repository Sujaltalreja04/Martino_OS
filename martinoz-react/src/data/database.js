/* ==========================================================================
   Martinoz Franchise Intelligence Platform - Shared Mock Database (ES Module)
   ========================================================================== */

const DB_PREFIX = 'martinoz_fip_';

const DEFAULT_OUTLETS = [
  { id: 'OUT-01', name: 'Surat Ring Road', city: 'Surat', manager: 'Rajesh Patel', sales: 4850, orders: 185, hygieneScore: 92, openComplaints: 2, wastageKg: 14.5, alertStatus: 'normal' },
  { id: 'OUT-02', name: 'Ahmedabad CG Road', city: 'Ahmedabad', manager: 'Amit Shah', sales: 6200, orders: 240, hygieneScore: 95, openComplaints: 0, wastageKg: 18.2, alertStatus: 'normal' },
  { id: 'OUT-03', name: 'Vadodara Alkapuri', city: 'Vadodara', manager: 'Nitin Mehta', sales: 4100, orders: 155, hygieneScore: 89, openComplaints: 1, wastageKg: 12.0, alertStatus: 'normal' },
  { id: 'OUT-04', name: 'Navsari Grid', city: 'Navsari', manager: 'Sandip Desai', sales: 3200, orders: 118, hygieneScore: 78, openComplaints: 4, wastageKg: 22.4, alertStatus: 'warning' },
  { id: 'OUT-05', name: 'Bopal Crossroad', city: 'Bopal', manager: 'Vikas Joshi', sales: 3800, orders: 142, hygieneScore: 65, openComplaints: 5, wastageKg: 19.8, alertStatus: 'critical' },
  { id: 'OUT-06', name: 'Surat Adajan', city: 'Surat', manager: 'Hardik Kakadiya', sales: 5100, orders: 198, hygieneScore: 94, openComplaints: 0, wastageKg: 15.0, alertStatus: 'normal' },
  { id: 'OUT-07', name: 'Ahmedabad Satellite', city: 'Ahmedabad', manager: 'Manoj Vyas', sales: 5900, orders: 228, hygieneScore: 91, openComplaints: 1, wastageKg: 16.5, alertStatus: 'normal' },
  { id: 'OUT-08', name: 'Vadodara Genda Circle', city: 'Vadodara', manager: 'Ketan Patel', sales: 4500, orders: 172, hygieneScore: 87, openComplaints: 2, wastageKg: 13.8, alertStatus: 'normal' },
  { id: 'OUT-09', name: 'Rajkot Yagnik Road', city: 'Rajkot', manager: 'Jayesh Dave', sales: 4900, orders: 190, hygieneScore: 93, openComplaints: 1, wastageKg: 11.2, alertStatus: 'normal' },
  { id: 'OUT-10', name: 'Gandhinagar Sector 11', city: 'Gandhinagar', manager: 'Sanjay Sharma', sales: 3600, orders: 130, hygieneScore: 82, openComplaints: 3, wastageKg: 17.0, alertStatus: 'warning' },
  { id: 'OUT-11', name: 'Anand Vallabh Vidyanagar', city: 'Anand', manager: 'Dharmesh Patel', sales: 4300, orders: 168, hygieneScore: 88, openComplaints: 0, wastageKg: 10.5, alertStatus: 'normal' },
  { id: 'OUT-12', name: 'Nadiad College Road', city: 'Nadiad', manager: 'Krunal Patel', sales: 2900, orders: 110, hygieneScore: 74, openComplaints: 4, wastageKg: 21.0, alertStatus: 'warning' },
  { id: 'OUT-13', name: 'Bharuch Station Road', city: 'Bharuch', manager: 'Pranav Solanki', sales: 3100, orders: 115, hygieneScore: 85, openComplaints: 2, wastageKg: 12.5, alertStatus: 'normal' },
  { id: 'OUT-14', name: 'Ankleshwar GIDC', city: 'Ankleshwar', manager: 'Bhavin Patel', sales: 3500, orders: 125, hygieneScore: 89, openComplaints: 1, wastageKg: 13.0, alertStatus: 'normal' },
  { id: 'OUT-15', name: 'Vapi NH 8', city: 'Vapi', manager: 'Dipesh Shah', sales: 4000, orders: 145, hygieneScore: 90, openComplaints: 0, wastageKg: 14.8, alertStatus: 'normal' },
  { id: 'OUT-16', name: 'Valsad Dharampur Road', city: 'Valsad', manager: 'Ashok Desai', sales: 2800, orders: 102, hygieneScore: 76, openComplaints: 3, wastageKg: 19.5, alertStatus: 'warning' },
  { id: 'OUT-17', name: 'Surat Vesu', city: 'Surat', manager: 'Vijay Goti', sales: 5700, orders: 220, hygieneScore: 96, openComplaints: 1, wastageKg: 16.0, alertStatus: 'normal' },
  { id: 'OUT-18', name: 'Ahmedabad Vastrapur', city: 'Ahmedabad', manager: 'Smit Patel', sales: 6400, orders: 250, hygieneScore: 94, openComplaints: 0, wastageKg: 18.0, alertStatus: 'normal' },
  { id: 'OUT-19', name: 'Vadodara Vasna Road', city: 'Vadodara', manager: 'Tejas Shah', sales: 4200, orders: 160, hygieneScore: 90, openComplaints: 1, wastageKg: 11.5, alertStatus: 'normal' },
  { id: 'OUT-20', name: 'Mehsana Highway', city: 'Mehsana', manager: 'Pankaj Patel', sales: 3300, orders: 120, hygieneScore: 80, openComplaints: 2, wastageKg: 15.6, alertStatus: 'normal' },
  { id: 'OUT-21', name: 'Palanpur Highway', city: 'Palanpur', manager: 'Alpesh Joshi', sales: 2600, orders: 95, hygieneScore: 71, openComplaints: 5, wastageKg: 24.2, alertStatus: 'critical' },
  { id: 'OUT-22', name: 'Patan GIDC', city: 'Patan', manager: 'Ramanlal Patel', sales: 2400, orders: 90, hygieneScore: 83, openComplaints: 1, wastageKg: 10.8, alertStatus: 'normal' },
  { id: 'OUT-23', name: 'Himatnagar Bypass', city: 'Himatnagar', manager: 'Nilesh Patel', sales: 2700, orders: 100, hygieneScore: 86, openComplaints: 0, wastageKg: 9.5, alertStatus: 'normal' },
  { id: 'OUT-24', name: 'Ahmedabad Bapunagar', city: 'Ahmedabad', manager: 'Kanubhai Shah', sales: 4800, orders: 180, hygieneScore: 80, openComplaints: 3, wastageKg: 16.8, alertStatus: 'warning' },
  { id: 'OUT-25', name: 'Surat Katargam', city: 'Surat', manager: 'Ketan Mawani', sales: 4950, orders: 192, hygieneScore: 91, openComplaints: 2, wastageKg: 15.2, alertStatus: 'normal' },
  { id: 'OUT-26', name: 'Jamnagar Town Hall', city: 'Jamnagar', manager: 'Ramesh Dave', sales: 3400, orders: 130, hygieneScore: 85, openComplaints: 1, wastageKg: 12.0, alertStatus: 'normal' },
  { id: 'OUT-27', name: 'Bhavnagar Waghawadi', city: 'Bhavnagar', manager: 'Kamlesh Gohil', sales: 3900, orders: 150, hygieneScore: 89, openComplaints: 0, wastageKg: 13.5, alertStatus: 'normal' },
  { id: 'OUT-28', name: 'Junagadh Kalwa Chowk', city: 'Junagadh', manager: 'Bharat Parmar', sales: 3100, orders: 115, hygieneScore: 82, openComplaints: 2, wastageKg: 11.0, alertStatus: 'normal' },
  { id: 'OUT-29', name: 'Bhuj Station Road', city: 'Bhuj', manager: 'Kishor Jadeja', sales: 3300, orders: 120, hygieneScore: 88, openComplaints: 1, wastageKg: 12.8, alertStatus: 'normal' },
  { id: 'OUT-30', name: 'Gandhidham Cargo', city: 'Gandhidham', manager: 'Haresh Shah', sales: 3600, orders: 135, hygieneScore: 85, openComplaints: 0, wastageKg: 13.0, alertStatus: 'normal' },
  { id: 'OUT-31', name: 'Morbi Sanala Road', city: 'Morbi', manager: 'Parth Patel', sales: 4100, orders: 155, hygieneScore: 87, openComplaints: 1, wastageKg: 14.2, alertStatus: 'normal' },
  { id: 'OUT-32', name: 'Surendranagar Main', city: 'Surendranagar', manager: 'Gopal Dave', sales: 2500, orders: 92, hygieneScore: 73, openComplaints: 4, wastageKg: 20.5, alertStatus: 'warning' },
  { id: 'OUT-33', name: 'Gondal Highway', city: 'Gondal', manager: 'Dilip Patel', sales: 2900, orders: 112, hygieneScore: 84, openComplaints: 1, wastageKg: 11.6, alertStatus: 'normal' },
  { id: 'OUT-34', name: 'Veraval Somnath', city: 'Veraval', manager: 'Mansukh Joshi', sales: 3000, orders: 110, hygieneScore: 81, openComplaints: 2, wastageKg: 12.2, alertStatus: 'normal' },
  { id: 'OUT-35', name: 'Porbandar Chowpatty', city: 'Porbandar', manager: 'Devendra Modha', sales: 2700, orders: 105, hygieneScore: 83, openComplaints: 0, wastageKg: 10.0, alertStatus: 'normal' },
  { id: 'OUT-36', name: 'Godhra Main Road', city: 'Godhra', manager: 'Rakesh Soni', sales: 2300, orders: 85, hygieneScore: 68, openComplaints: 4, wastageKg: 18.5, alertStatus: 'warning' },
  { id: 'OUT-37', name: 'Dahod Station Road', city: 'Dahod', manager: 'Yusuf Khan', sales: 2450, orders: 88, hygieneScore: 70, openComplaints: 3, wastageKg: 17.2, alertStatus: 'warning' },
  { id: 'OUT-38', name: 'Amreli Tower Road', city: 'Amreli', manager: 'Hasmukh Patel', sales: 2550, orders: 94, hygieneScore: 80, openComplaints: 1, wastageKg: 11.8, alertStatus: 'normal' },
  { id: 'OUT-39', name: 'Ahmedabad Nikol', city: 'Ahmedabad', manager: 'Pankaj Vaghela', sales: 5200, orders: 200, hygieneScore: 92, openComplaints: 1, wastageKg: 14.8, alertStatus: 'normal' },
  { id: 'OUT-40', name: 'Surat Varachha', city: 'Surat', manager: 'Nimesh Sheladiya', sales: 5800, orders: 215, hygieneScore: 93, openComplaints: 2, wastageKg: 16.2, alertStatus: 'normal' }
];

const DEFAULT_TICKETS = [
  { id: 'TCK-101', outletId: 'OUT-06', outletName: 'Surat Adajan', category: 'Food Safety', priority: 'Critical', description: 'FSSAI Warning Complaint: Cockroach found inside pizza at University Road outlet, Ahmedabad. Severe regulatory compliance threat.', status: 'Escalated', dateCreated: '2026-06-18T10:00:00Z', slaHours: 2 },
  { id: 'TCK-102', outletId: 'OUT-05', outletName: 'Bopal Crossroad', category: 'Food Safety', priority: 'Critical', description: 'Toothpick found baked inside Double Cheese Margherita crust. Customer threatened to post video review on Twitter.', status: 'Open', dateCreated: '2026-06-18T08:30:00Z', slaHours: 4 },
  { id: 'TCK-103', outletId: 'OUT-04', outletName: 'Navsari Grid', category: 'Food Safety', priority: 'High', description: 'Customer reported stomach ache after eating dinner and accused outlet staff of using stale raw ingredients.', status: 'Open', dateCreated: '2026-06-18T11:15:00Z', slaHours: 12 },
  { id: 'TCK-104', outletId: 'OUT-03', outletName: 'Vadodara Alkapuri', category: 'Taste', priority: 'High', description: 'Garlic Bread subpar: customers repeatedly complaining that garlic butter spread is dry and cheese is cold/rubbery.', status: 'Open', dateCreated: '2026-06-18T12:00:00Z', slaHours: 12 },
  { id: 'TCK-105', outletId: 'OUT-12', outletName: 'Nadiad College Road', category: 'Delivery', priority: 'Medium', description: 'Delivery packaging failure: 9 Cheesy Pizza arrived damaged with cheese slides completely fallen off the cardboard box base.', status: 'Open', dateCreated: '2026-06-18T09:45:00Z', slaHours: 24 },
  { id: 'TCK-106', outletId: 'OUT-04', outletName: 'Navsari Grid', category: 'Hygiene', priority: 'High', description: 'Checks failed: dirty tables and floors reported by dining group. No pre-shift hygiene checklist was filled out.', status: 'Open', dateCreated: '2026-06-17T20:00:00Z', slaHours: 12 },
  { id: 'TCK-107', outletId: 'OUT-03', outletName: 'Vadodara Alkapuri', category: 'Delivery', priority: 'Medium', description: 'Long wait times consistently flagged. Order preparation delayed by over 45 minutes without KDS queue updates.', status: 'Resolved', dateCreated: '2026-06-17T18:30:00Z', slaHours: 24 },
  { id: 'TCK-108', outletId: 'OUT-32', outletName: 'Surendranagar Main', category: 'Packaging', priority: 'Low', description: 'Standard carry bag handles tore under weight of three pizza boxes. Suggested double-bagging protocol.', status: 'Resolved', dateCreated: '2026-06-17T14:00:00Z', slaHours: 48 },
  { id: 'TCK-109', outletId: 'OUT-05', outletName: 'Bopal Crossroad', category: 'Taste', priority: 'High', description: 'Recipe deviation: customer complained that toppings were deficient and pizza crust was undercooked and doughy.', status: 'Resolved', dateCreated: '2026-06-17T16:00:00Z', slaHours: 12 },
  { id: 'TCK-110', outletId: 'OUT-21', outletName: 'Palanpur Highway', category: 'Staff Behavior', priority: 'Medium', description: 'Staff denied recipe mistake when client raised concerns about missing olive toppings. Refused cash refund.', status: 'Open', dateCreated: '2026-06-18T06:00:00Z', slaHours: 24 }
];

const DEFAULT_SKUS = [
  { id: 'SKU-01', name: 'Double Cheese Margherita', price: 249, category: 'Pizza' },
  { id: 'SKU-02', name: '7 Cheese Pizza', price: 349, category: 'Pizza' },
  { id: 'SKU-03', name: 'Garlic Breadsticks', price: 129, category: 'Sides' },
  { id: 'SKU-04', name: 'Tandoori Paneer Pizza', price: 299, category: 'Pizza' },
  { id: 'SKU-05', name: 'Chocolate Lava Cake', price: 99, category: 'Desserts' },
  { id: 'SKU-06', name: 'Spicy Veg Pizza', price: 219, category: 'Pizza' }
];

const DEFAULT_INVENTORY = [
  { id: 'INV-101', outletId: 'OUT-05', skuId: 'SKU-01', stock: 5, demand: 45 },
  { id: 'INV-102', outletId: 'OUT-01', skuId: 'SKU-02', stock: 120, demand: 12 },
  { id: 'INV-103', outletId: 'OUT-02', skuId: 'SKU-03', stock: 200, demand: 220 },
  { id: 'INV-104', outletId: 'OUT-04', skuId: 'SKU-04', stock: 8, demand: 60 },
  { id: 'INV-105', outletId: 'OUT-12', skuId: 'SKU-05', stock: 150, demand: 20 },
  { id: 'INV-106', outletId: 'OUT-21', skuId: 'SKU-06', stock: 3, demand: 35 },
  { id: 'INV-107', outletId: 'OUT-11', skuId: 'SKU-01', stock: 100, demand: 105 },
  { id: 'INV-108', outletId: 'OUT-03', skuId: 'SKU-03', stock: 15, demand: 85 },
  { id: 'INV-109', outletId: 'OUT-07', skuId: 'SKU-02', stock: 90, demand: 10 },
  { id: 'INV-110', outletId: 'OUT-16', skuId: 'SKU-04', stock: 2, demand: 30 }
];

const DEFAULT_KDS = [
  { id: 'ORD-1001', outletId: 'OUT-05', customerName: 'Jatin Shah', items: '2x Double Cheese Margherita', status: 'Baking', prepTimeMinutes: 22, timestamp: '2026-06-18T17:30:00Z' },
  { id: 'ORD-1002', outletId: 'OUT-05', customerName: 'Neha Patel', items: '1x Garlic Breadsticks, 1x Lava Cake', status: 'Preparing', prepTimeMinutes: 8, timestamp: '2026-06-18T17:45:00Z' },
  { id: 'ORD-1003', outletId: 'OUT-05', customerName: 'Aarav Mehta', items: '1x 7 Cheese Pizza', status: 'Ready', prepTimeMinutes: 28, timestamp: '2026-06-18T17:15:00Z' },
  { id: 'ORD-1004', outletId: 'OUT-01', customerName: 'Riddhi Goti', items: '3x Double Cheese Margherita', status: 'Ready', prepTimeMinutes: 14, timestamp: '2026-06-18T17:20:00Z' },
  { id: 'ORD-1005', outletId: 'OUT-01', customerName: 'Dhruv Desai', items: '1x Spicy Veg Pizza, 1x Lava Cake', status: 'Preparing', prepTimeMinutes: 5, timestamp: '2026-06-18T17:50:00Z' },
  { id: 'ORD-1006', outletId: 'OUT-02', customerName: 'Hardik Kakadiya', items: '2x Garlic Breadsticks', status: 'Baking', prepTimeMinutes: 12, timestamp: '2026-06-18T17:40:00Z' },
  { id: 'ORD-1007', outletId: 'OUT-02', customerName: 'Priya Dave', items: '1x 7 Cheese Pizza, 1x Paneer Pizza', status: 'Preparing', prepTimeMinutes: 4, timestamp: '2026-06-18T17:52:00Z' },
  { id: 'ORD-1008', outletId: 'OUT-04', customerName: 'Meet Patel', items: '1x Tandoori Paneer Pizza', status: 'Baking', prepTimeMinutes: 18, timestamp: '2026-06-18T17:35:00Z' },
  { id: 'ORD-1009', outletId: 'OUT-12', customerName: 'Kunal Soni', items: '5x Chocolate Lava Cake', status: 'Ready', prepTimeMinutes: 9, timestamp: '2026-06-18T17:28:00Z' },
  { id: 'ORD-1010', outletId: 'OUT-21', customerName: 'Sunita Joshi', items: '2x Spicy Veg Pizza', status: 'Preparing', prepTimeMinutes: 6, timestamp: '2026-06-18T17:51:00Z' }
];

const DEFAULT_IOT = [
  { outletId: 'OUT-01', fridgeTemp: 3.2, ovenTemp: 242, timestamp: '2026-06-18T17:00:00Z' },
  { outletId: 'OUT-02', fridgeTemp: 2.8, ovenTemp: 248, timestamp: '2026-06-18T17:00:00Z' },
  { outletId: 'OUT-03', fridgeTemp: 3.5, ovenTemp: 235, timestamp: '2026-06-18T17:00:00Z' },
  { outletId: 'OUT-04', fridgeTemp: 5.5, ovenTemp: 238, timestamp: '2026-06-18T17:00:00Z' },
  { outletId: 'OUT-05', fridgeTemp: 6.2, ovenTemp: 228, timestamp: '2026-06-18T17:00:00Z' },
  { outletId: 'OUT-12', fridgeTemp: 3.9, ovenTemp: 240, timestamp: '2026-06-18T17:00:00Z' },
  { outletId: 'OUT-21', fridgeTemp: 4.1, ovenTemp: 244, timestamp: '2026-06-18T17:00:00Z' }
];

const DEFAULT_SHIPMENTS = [
  { id: 'TRK-401', origin: 'Ahmedabad HQ', destination: 'Surat Ring Road', cargo: '200kg Cheese, 100kg Flour', progress: 65, status: 'In Transit', driver: 'Ramesh Singh' },
  { id: 'TRK-402', origin: 'Ahmedabad HQ', destination: 'Bopal Crossroad', cargo: '150kg Flour, 80kg Sauce', progress: 90, status: 'Near Destination', driver: 'Karan Patel' },
  { id: 'TRK-403', origin: 'Ahmedabad HQ', destination: 'Navsari Grid', cargo: '120kg Cheese, 40kg Spices', progress: 40, status: 'In Transit', driver: 'Vikram Solanki' },
  { id: 'TRK-404', origin: 'Ahmedabad HQ', destination: 'Nadiad College Road', cargo: '80kg Pizza Dough', progress: 100, status: 'Delivered', driver: 'Sanjay Dave' }
];

const DEFAULT_PROMOS = [
  { code: 'BOGO50', discount: 25, description: 'Buy 1 Get 1 50% Off (25% effective)', status: 'Active' },
  { code: 'PIZZA20', discount: 20, description: 'Flat 20% Discount on all orders', status: 'Active' },
  { code: 'MARGHERITAPROMO', discount: 30, description: 'Exclusive 30% discount on Margherita', status: 'Active' }
];

function initDatabase() {
  const seedFlag = DB_PREFIX + 'v4_expanded';
  if (!localStorage.getItem(seedFlag)) {
    ['outlets','tickets','skus','inventory','kds','iot','shipments','promos'].forEach(k => localStorage.removeItem(DB_PREFIX + k));
    localStorage.setItem(seedFlag, 'true');
  }
  if (!localStorage.getItem(DB_PREFIX + 'outlets')) localStorage.setItem(DB_PREFIX + 'outlets', JSON.stringify(DEFAULT_OUTLETS));
  if (!localStorage.getItem(DB_PREFIX + 'tickets')) localStorage.setItem(DB_PREFIX + 'tickets', JSON.stringify(DEFAULT_TICKETS));
  if (!localStorage.getItem(DB_PREFIX + 'skus')) localStorage.setItem(DB_PREFIX + 'skus', JSON.stringify(DEFAULT_SKUS));
  if (!localStorage.getItem(DB_PREFIX + 'inventory')) localStorage.setItem(DB_PREFIX + 'inventory', JSON.stringify(DEFAULT_INVENTORY));
  if (!localStorage.getItem(DB_PREFIX + 'kds')) localStorage.setItem(DB_PREFIX + 'kds', JSON.stringify(DEFAULT_KDS));
  if (!localStorage.getItem(DB_PREFIX + 'iot')) localStorage.setItem(DB_PREFIX + 'iot', JSON.stringify(DEFAULT_IOT));
  if (!localStorage.getItem(DB_PREFIX + 'shipments')) localStorage.setItem(DB_PREFIX + 'shipments', JSON.stringify(DEFAULT_SHIPMENTS));
  if (!localStorage.getItem(DB_PREFIX + 'promos')) localStorage.setItem(DB_PREFIX + 'promos', JSON.stringify(DEFAULT_PROMOS));
}

export const Database = {
  getOutlets() { initDatabase(); return JSON.parse(localStorage.getItem(DB_PREFIX + 'outlets')); },
  saveOutlets(outlets) { localStorage.setItem(DB_PREFIX + 'outlets', JSON.stringify(outlets)); },
  getTickets() { initDatabase(); return JSON.parse(localStorage.getItem(DB_PREFIX + 'tickets')); },
  saveTickets(tickets) { localStorage.setItem(DB_PREFIX + 'tickets', JSON.stringify(tickets)); },
  resolveTicket(ticketId) {
    const tickets = this.getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) {
      ticket.status = 'Resolved';
      this.saveTickets(tickets);
      const outlets = this.getOutlets();
      const outlet = outlets.find(o => o.id === ticket.outletId);
      if (outlet && outlet.openComplaints > 0) {
        outlet.openComplaints--;
        this.recalculateOutletAlertStatus(outlet);
        this.saveOutlets(outlets);
      }
    }
  },
  escalateTicket(ticketId) {
    const tickets = this.getTickets();
    const ticket = tickets.find(t => t.id === ticketId);
    if (ticket) { ticket.status = 'Escalated'; this.saveTickets(tickets); }
  },
  addTicket(ticketData) {
    const tickets = this.getTickets();
    const outlets = this.getOutlets();
    const targetOutlet = outlets.find(o => o.id === ticketData.outletId);
    const outletName = targetOutlet ? targetOutlet.name : 'Unknown Outlet';
    const newTicket = {
      id: 'TCK-' + (100 + tickets.length + 1),
      outletId: ticketData.outletId,
      outletName,
      category: ticketData.category,
      priority: ticketData.priority,
      description: ticketData.description,
      status: 'Open',
      dateCreated: new Date().toISOString(),
      slaHours: ticketData.priority === 'Critical' ? 4 : (ticketData.priority === 'High' ? 12 : 24)
    };
    tickets.unshift(newTicket);
    this.saveTickets(tickets);
    if (targetOutlet) {
      targetOutlet.openComplaints++;
      this.recalculateOutletAlertStatus(targetOutlet);
      this.saveOutlets(outlets);
    }
    return newTicket;
  },
  submitHygieneAudit(outletId, score) {
    const outlets = this.getOutlets();
    const outlet = outlets.find(o => o.id === outletId);
    if (outlet) { outlet.hygieneScore = score; this.recalculateOutletAlertStatus(outlet); this.saveOutlets(outlets); }
  },
  recalculateOutletAlertStatus(outlet) {
    if (outlet.hygieneScore < 70 || outlet.openComplaints >= 5) outlet.alertStatus = 'critical';
    else if (outlet.hygieneScore < 80 || outlet.openComplaints >= 3) outlet.alertStatus = 'warning';
    else outlet.alertStatus = 'normal';
  },
  getGlobalStats() {
    const outlets = this.getOutlets();
    const tickets = this.getTickets();
    let totalRevenue = 0, totalOrders = 0, sumHygiene = 0, totalWastage = 0, warningOutlets = 0, criticalOutlets = 0;
    outlets.forEach(o => {
      totalRevenue += o.sales; totalOrders += o.orders; sumHygiene += o.hygieneScore; totalWastage += o.wastageKg;
      if (o.alertStatus === 'warning') warningOutlets++;
      if (o.alertStatus === 'critical') criticalOutlets++;
    });
    const avgHygieneScore = outlets.length > 0 ? sumHygiene / outlets.length : 0;
    const openTicketsCount = tickets.filter(t => t.status === 'Open' || t.status === 'Escalated').length;
    return { totalRevenue, totalOrders, avgHygieneScore, openComplaints: openTicketsCount, totalWastageKg: totalWastage, warningOutletsCount: warningOutlets, criticalOutletsCount: criticalOutlets, totalOutletsCount: outlets.length };
  },
  getSkus() { initDatabase(); return JSON.parse(localStorage.getItem(DB_PREFIX + 'skus')); },
  getInventory() { initDatabase(); return JSON.parse(localStorage.getItem(DB_PREFIX + 'inventory')); },
  saveInventory(inventory) { localStorage.setItem(DB_PREFIX + 'inventory', JSON.stringify(inventory)); },
  getInventoryStats() {
    const inventory = this.getInventory();
    const skus = this.getSkus();
    let totalLostSales = 0, totalWastageVal = 0, alignedCount = 0, totalAlerts = 0;
    inventory.forEach(item => {
      const sku = skus.find(s => s.id === item.skuId);
      if (!sku) return;
      const diff = item.stock - item.demand;
      if (diff < 0) { const lost = Math.abs(diff) * sku.price; totalLostSales += lost; if (Math.abs(diff) >= 20) totalAlerts++; }
      else if (diff > 0) { const waste = diff * sku.price; totalWastageVal += waste; if (diff >= 20) totalAlerts++; }
      if (Math.abs(diff) <= 5) alignedCount++;
    });
    const alignmentScore = inventory.length > 0 ? Math.round((alignedCount / inventory.length) * 100) : 100;
    return { totalLostSales, totalWastageVal, totalAlerts, alignmentScore, totalItemsCount: inventory.length };
  },
  getKds() { initDatabase(); return JSON.parse(localStorage.getItem(DB_PREFIX + 'kds')); },
  saveKds(kds) { localStorage.setItem(DB_PREFIX + 'kds', JSON.stringify(kds)); },
  getIot() { initDatabase(); return JSON.parse(localStorage.getItem(DB_PREFIX + 'iot')); },
  saveIot(iot) { localStorage.setItem(DB_PREFIX + 'iot', JSON.stringify(iot)); },
  getShipments() { initDatabase(); return JSON.parse(localStorage.getItem(DB_PREFIX + 'shipments')); },
  saveShipments(shipments) { localStorage.setItem(DB_PREFIX + 'shipments', JSON.stringify(shipments)); },
  getPromos() { initDatabase(); return JSON.parse(localStorage.getItem(DB_PREFIX + 'promos')); },
  savePromos(promos) { localStorage.setItem(DB_PREFIX + 'promos', JSON.stringify(promos)); },
  addPromo(code, discount, description) {
    const promos = this.getPromos();
    const existing = promos.find(p => p.code.toUpperCase() === code.toUpperCase());
    if (existing) { existing.discount = discount; existing.description = description; existing.status = 'Active'; }
    else promos.push({ code: code.toUpperCase(), discount, description, status: 'Active' });
    this.savePromos(promos);
  }
};
