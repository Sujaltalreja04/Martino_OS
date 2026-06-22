import { useState, useMemo } from 'react';
import TopHeader from '../components/TopHeader';
import { useDatabase } from '../context/DatabaseContext';

const AVAILABLE_ADDONS = {
  'Pizza': [
    { name: 'Extra Cheese', price: 49 },
    { name: 'Mushrooms', price: 29 },
    { name: 'Jalapenos', price: 19 }
  ],
  'Sides': [
    { name: 'Extra Dip', price: 15 }
  ],
  'Desserts': [
    { name: 'Vanilla Scoop', price: 39 },
    { name: 'Chocolate Drizzle', price: 19 }
  ]
};

export default function AiBilling() {
  const { db } = useDatabase();
  const skus = db.getSkus();
  const rawMaterials = db.getRawMaterials();
  const promos = db.getPromos();

  // States
  const [cart, setCart] = useState([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [orderType, setOrderType] = useState('Dine-In');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [orderNotes, setOrderNotes] = useState('');

  // Context-aware metadata
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [paxCount, setPaxCount] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPartner, setDeliveryPartner] = useState('In-House');
  const [pickupTime, setPickupTime] = useState('As soon as possible');

  // Simulated payments details
  const [cashTendered, setCashTendered] = useState('');
  const [cardSwipeSimulated, setCardSwipeSimulated] = useState(false);
  const [upiVerified, setUpiVerified] = useState(false);
  const [isVerifyingUPI, setIsVerifyingUPI] = useState(false);

  // Manual discount & service charge
  const [customDiscount, setCustomDiscount] = useState('');
  const [serviceChargeEnabled, setServiceChargeEnabled] = useState(false);

  // Thermal invoice state
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptNumber, setReceiptNumber] = useState('');

  const categories = ['All', ...new Set(skus.map(s => s.category))];

  // Filtering SKUs
  const filteredSkus = skus.filter(sku => {
    const matchesCategory = activeCategory === 'All' || sku.category === activeCategory;
    const matchesSearch = sku.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (sku) => {
    const existing = cart.find(item => item.id === sku.id);
    if (existing) {
      setCart(cart.map(item => item.id === sku.id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...sku, qty: 1, selectedAddons: [] }]);
    }
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));

  const adjustQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : item;
      }
      return item;
    }));
  };

  const toggleAddon = (itemId, addon) => {
    setCart(cart.map(item => {
      if (item.id === itemId) {
        const selectedAddons = item.selectedAddons || [];
        const hasAddon = selectedAddons.some(a => a.name === addon.name);
        const newAddons = hasAddon 
          ? selectedAddons.filter(a => a.name !== addon.name)
          : [...selectedAddons, addon];
        return { ...item, selectedAddons: newAddons };
      }
      return item;
    }));
  };

  const handleApplyPromo = () => {
    const validPromo = promos.find(p => p.code.toUpperCase() === promoCode.toUpperCase() && p.status === 'Active');
    if (validPromo) {
      setAppliedPromo(validPromo);
      setPromoCode('');
    } else {
      alert('Invalid or expired promo code');
    }
  };

  const simulateVerifyUPI = () => {
    if (upiVerified) return;
    setIsVerifyingUPI(true);
    setTimeout(() => {
      setIsVerifyingUPI(false);
      setUpiVerified(true);
    }, 1500);
  };

  const simulateSwipeCard = () => {
    if (cardSwipeSimulated) return;
    setCardSwipeSimulated(true);
  };

  // Subtotal including addons
  const subtotal = cart.reduce((sum, item) => {
    const addonsTotal = (item.selectedAddons || []).reduce((s, a) => s + a.price, 0);
    return sum + ((item.price + addonsTotal) * item.qty);
  }, 0);

  // Service Charge (5% of subtotal)
  const serviceCharge = serviceChargeEnabled ? subtotal * 0.05 : 0;
  
  // Custom manual discount
  const customDiscountAmount = parseFloat(customDiscount) || 0;

  // AI Mock Logic: Recommend overstocked item discounts
  const overstockedMaterials = rawMaterials.filter(rm => rm.status === 'Overstock');
  const isPizzaOverstocked = overstockedMaterials.some(rm => rm.name.includes('Flour') || rm.name.includes('Boxes'));
  
  const aiSuggestions = useMemo(() => {
    let suggestions = [];
    if (cart.length === 0) {
      suggestions.push({ ...skus.find(s => s.id === 'SKU-01'), reason: 'Popular Now' });
      suggestions.push({ ...skus.find(s => s.id === 'SKU-05'), reason: 'Hot Dessert' });
    } else {
      const hasPizza = cart.some(item => item.category === 'Pizza');
      const hasDrinkOrSides = cart.some(item => item.category === 'Sides' || item.category === 'Desserts');
      if (hasPizza && !hasDrinkOrSides) {
        suggestions.push({ ...skus.find(s => s.id === 'SKU-03'), reason: 'Frequent Pairing' });
        suggestions.push({ ...skus.find(s => s.id === 'SKU-05'), reason: 'Sweet Finish' });
      } else {
        suggestions.push({ ...skus.find(s => s.id === 'SKU-06'), reason: 'Try New' });
      }
    }
    return suggestions;
  }, [cart, skus]);

  // Discounts
  let aiDiscountAmount = isPizzaOverstocked && cart.some(i => i.category === 'Pizza') ? subtotal * 0.1 : 0;
  let manualDiscountAmount = 0;
  if (appliedPromo) {
    manualDiscountAmount = subtotal * (appliedPromo.discount / 100);
  }
  const totalDiscount = aiDiscountAmount + manualDiscountAmount + customDiscountAmount;
  const tax = Math.max((subtotal - totalDiscount) * 0.05, 0); // 5% GST on net amount
  const total = Math.max(subtotal + serviceCharge + tax - totalDiscount, 0);

  const handleCheckout = () => {
    if (cart.length === 0) return alert("Cart is empty");
    if (orderType === 'Delivery' && !deliveryAddress.trim()) {
      return alert("Please enter delivery address for courier dispatch");
    }
    
    // Check payment verification
    if (paymentMethod === 'UPI' && !upiVerified) {
      return alert("Please scan the UPI QR and verify the payment first");
    }
    if (paymentMethod === 'Card' && !cardSwipeSimulated) {
      return alert("Please simulate the card payment on the terminal first");
    }
    if (paymentMethod === 'Cash') {
      const cash = parseFloat(cashTendered) || 0;
      if (cash < total) {
        return alert("Cash tendered is less than the total bill amount");
      }
    }

    // Open thermal invoice modal
    const randomId = 'MZ-' + Math.floor(100000 + Math.random() * 900000);
    setReceiptNumber(randomId);
    setIsReceiptOpen(true);
  };

  const handlePrintReceipt = () => {
    alert("Receipt sent to thermal USB-001 printer. Printing successful!");
  };

  const handleReceiptConfirm = () => {
    setCart([]);
    setCustomerInfo({ name: '', phone: '' });
    setAppliedPromo(null);
    setOrderNotes('');
    setTableNumber('Table 1');
    setPaxCount(1);
    setDeliveryAddress('');
    setDeliveryPartner('In-House');
    setCustomDiscount('');
    setServiceChargeEnabled(false);
    setCashTendered('');
    setCardSwipeSimulated(false);
    setUpiVerified(false);
    setIsReceiptOpen(false);
  };

  return (
    <>
      <TopHeader title="AI-Powered Billing POS" />
      <section className="pos-layout">
        
        {/* Left Side: Product Catalog & AI */}
        <div className="pos-catalog">
          
          {/* Top Control Bar */}
          <div style={{ display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '250px' }}>
              <i className="fa-solid fa-search" style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
              <input 
                type="text" 
                className="input-glass" 
                placeholder="Search products..." 
                style={{ paddingLeft: '40px', width: '100%' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' }}>
              {categories.map(cat => (
                <button 
                  key={cat} 
                  className={`category-pill ${activeCategory === cat ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* AI Banner */}
          {searchTerm === '' && activeCategory === 'All' && (
            <div className="ai-alert-item info" style={{ marginBottom: '24px' }}>
              <div className="alert-badge-icon"><i className="fa-solid fa-brain" style={{ color: 'var(--info)' }}></i></div>
              <div className="alert-body">
                <h4 style={{ color: 'var(--info)' }}>AI Copilot Active</h4>
                {isPizzaOverstocked ? (
                  <p>System detects heavy overstock of Pizza Flour/Boxes. Dynamically applying 10% discount on Pizza combos to clear inventory.</p>
                ) : (
                  <p>Analyzing customer patterns to suggest optimal up-sells.</p>
                )}
              </div>
            </div>
          )}

          {/* Smart Suggestions */}
          {searchTerm === '' && activeCategory === 'All' && (
            <>
              <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="fa-solid fa-wand-magic-sparkles text-gold"></i> Recommended for this Order
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                {aiSuggestions.map(sku => (
                  <div key={`sug-${sku.id}`} className="pos-item-card suggestion-glow" onClick={() => addToCart(sku)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '8px' }}>
                      <span className="badge badge-info">{sku.reason}</span>
                      <i className="fa-solid fa-circle-plus" style={{ color: 'rgba(255, 183, 3, 0.4)', fontSize: '16px', transition: 'var(--transition-smooth)' }}></i>
                    </div>
                    <div>
                      <h4>{sku.name}</h4>
                      <div className="price">₹{sku.price}</div>
                    </div>
                  </div>
                ))}
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid var(--border-glass)', marginBottom: '24px' }} />
            </>
          )}

          {/* Full Catalog */}
          <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}><i className="fa-solid fa-list" style={{ color: 'var(--text-secondary)' }}></i> Menu Items</h3>
          {filteredSkus.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>No products found.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {filteredSkus.map(sku => (
                <div key={sku.id} className="pos-item-card" onClick={() => addToCart(sku)}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: '8px' }}>
                    <i className="fa-solid fa-circle-plus" style={{ color: 'rgba(255, 255, 255, 0.15)', fontSize: '16px', transition: 'var(--transition-smooth)' }}></i>
                  </div>
                  <div>
                    <h4>{sku.name}</h4>
                    <div className="price">₹{sku.price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Right Side: Cart/Invoice */}
        <div className="pos-cart">
          
          <div style={{ padding: '24px', borderBottom: '1px solid var(--border-glass)' }}>
            <div className="order-type-tabs">
              {['Dine-In', 'Takeaway', 'Delivery'].map(type => (
                <button 
                  key={type} 
                  className={`order-type-btn ${orderType === type ? 'active' : ''}`}
                  onClick={() => setOrderType(type)}
                >
                  {type}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <input type="text" className="input-glass" placeholder="Customer Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} style={{ flex: 1 }} />
              <input type="text" className="input-glass" placeholder="Phone" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} style={{ width: '130px' }} />
            </div>

            {/* Dine-In Custom Details */}
            {orderType === 'Dine-In' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <select 
                  className="input-glass" 
                  value={tableNumber} 
                  onChange={e => setTableNumber(e.target.value)} 
                  style={{ flex: 1 }}
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={`t-${i+1}`} value={`Table ${i+1}`} style={{ background: 'var(--bg-darkest)' }}>Table {i+1}</option>
                  ))}
                </select>
                <input 
                  type="number" 
                  className="input-glass" 
                  placeholder="Pax" 
                  min="1"
                  value={paxCount} 
                  onChange={e => setPaxCount(parseInt(e.target.value) || 1)} 
                  style={{ width: '90px' }} 
                />
              </div>
            )}

            {/* Takeaway Custom Details */}
            {orderType === 'Takeaway' && (
              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <select 
                  className="input-glass" 
                  value={pickupTime} 
                  onChange={e => setPickupTime(e.target.value)} 
                  style={{ flex: 1 }}
                >
                  <option value="As soon as possible" style={{ background: 'var(--bg-darkest)' }}>As soon as possible</option>
                  <option value="In 10 mins" style={{ background: 'var(--bg-darkest)' }}>In 10 mins</option>
                  <option value="In 20 mins" style={{ background: 'var(--bg-darkest)' }}>In 20 mins</option>
                  <option value="In 30 mins" style={{ background: 'var(--bg-darkest)' }}>In 30 mins</option>
                  <option value="Scheduled Pickup" style={{ background: 'var(--bg-darkest)' }}>Scheduled Pickup (Call Customer)</option>
                </select>
              </div>
            )}

            {/* Delivery Custom Details */}
            {orderType === 'Delivery' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
                <select 
                  className="input-glass" 
                  value={deliveryPartner} 
                  onChange={e => setDeliveryPartner(e.target.value)} 
                  style={{ width: '100%' }}
                >
                  <option value="In-House Delivery" style={{ background: 'var(--bg-darkest)' }}>In-House Courier</option>
                  <option value="Swiggy Genie" style={{ background: 'var(--bg-darkest)' }}>Swiggy Dispatch</option>
                  <option value="Zomato Share" style={{ background: 'var(--bg-darkest)' }}>Zomato Dispatch</option>
                  <option value="Dunzo Agent" style={{ background: 'var(--bg-darkest)' }}>Dunzo Courier</option>
                </select>
                <textarea 
                  className="input-glass" 
                  placeholder="Enter Delivery Address..." 
                  value={deliveryAddress} 
                  onChange={e => setDeliveryAddress(e.target.value)} 
                  rows="2"
                  style={{ width: '100%', resize: 'none' }}
                />
              </div>
            )}
          </div>

          <div className="pos-cart-items">
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <i className="fa-solid fa-basket-shopping" style={{ fontSize: '3.5rem', opacity: 0.3, color: 'var(--primary)' }}></i>
                <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0 }}>Cart is empty</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Click items on the left to add them here</p>
              </div>
            ) : (
              cart.map(item => {
                const itemAddons = AVAILABLE_ADDONS[item.category] || [];
                const addonsPrice = (item.selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
                const displayPrice = item.price + addonsPrice;
                
                return (
                  <div key={item.id} className="cart-item" style={{ display: 'flex', flexDirection: 'column', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ flex: '1' }}>
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          ₹{displayPrice} x {item.qty}
                          {item.selectedAddons && item.selectedAddons.length > 0 && (
                            <span style={{ color: 'var(--secondary)', marginLeft: '6px', fontSize: '0.75rem', fontWeight: '600' }}>
                              (+{item.selectedAddons.map(a => a.name).join(', ')})
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingRight: '8px' }}>
                        <button className="btn btn-icon btn-sm" onClick={() => adjustQty(item.id, -1)}><i className="fa-solid fa-minus"></i></button>
                        <span style={{ width: '20px', textAlign: 'center', fontSize: '13px', fontWeight: '600' }}>{item.qty}</span>
                        <button className="btn btn-icon btn-sm" onClick={() => adjustQty(item.id, 1)}><i className="fa-solid fa-plus"></i></button>
                        <button className="btn btn-icon btn-sm text-danger" onClick={() => removeFromCart(item.id)} style={{ marginLeft: '6px' }}><i className="fa-solid fa-trash"></i></button>
                      </div>
                    </div>
                    {/* Add-on selection buttons if available */}
                    {itemAddons.length > 0 && (
                      <div className="cart-item-addons">
                        {itemAddons.map(addon => {
                          const isActive = (item.selectedAddons || []).some(a => a.name === addon.name);
                          return (
                            <button
                              key={addon.name}
                              className={`addon-toggle-btn ${isActive ? 'active' : ''}`}
                              onClick={() => toggleAddon(item.id, addon)}
                            >
                              +{addon.name} (₹{addon.price})
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
            
            {cart.length > 0 && (
              <div style={{ marginTop: '10px' }}>
                <textarea 
                  className="input-glass" 
                  placeholder="Order notes (e.g. Extra spicy, No onions)..." 
                  rows="2" 
                  style={{ width: '100%', resize: 'none' }}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                ></textarea>
              </div>
            )}
          </div>

          <div className="pos-cart-footer">
            
            {/* Promo Code Section */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <input 
                type="text" 
                className="input-glass" 
                placeholder="Promo Code" 
                value={promoCode} 
                onChange={(e) => setPromoCode(e.target.value)} 
                style={{ flex: 1 }}
                disabled={appliedPromo !== null}
              />
              {appliedPromo ? (
                <button className="btn btn-danger-outline" onClick={() => setAppliedPromo(null)}>Remove</button>
              ) : (
                <button className="btn btn-outline" onClick={handleApplyPromo}>Apply</button>
              )}
            </div>

            {/* Custom Discount & Service Charge */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input 
                type="number" 
                className="input-glass" 
                placeholder="Discount Amount (₹)" 
                value={customDiscount} 
                onChange={(e) => setCustomDiscount(e.target.value)} 
                style={{ flex: 1 }}
              />
              <button 
                className={`btn ${serviceChargeEnabled ? 'btn-primary' : 'btn-outline'}`} 
                onClick={() => setServiceChargeEnabled(!serviceChargeEnabled)}
                style={{ fontSize: '11px', whiteSpace: 'nowrap', padding: '10px 14px' }}
              >
                Service (5%) {serviceChargeEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>

            {serviceCharge > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                <span>Service Charge (5%)</span>
                <span>₹{serviceCharge.toFixed(2)}</span>
              </div>
            )}
            
            {aiDiscountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: 'var(--success)', fontSize: '0.9rem' }}>
                <span>AI Auto-Discount (10%)</span>
                <span>-₹{aiDiscountAmount.toFixed(2)}</span>
              </div>
            )}
            
            {appliedPromo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: 'var(--primary)', fontSize: '0.9rem' }}>
                <span>Promo: {appliedPromo.code} ({appliedPromo.discount}%)</span>
                <span>-₹{manualDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            {customDiscountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', color: 'var(--primary)', fontSize: '0.9rem' }}>
                <span>Manual Discount</span>
                <span>-₹{customDiscountAmount.toFixed(2)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              <span>Tax (5% GST)</span>
              <span>₹{tax.toFixed(2)}</span>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', fontSize: '1.4rem', fontWeight: 'bold' }}>
              <span>Total</span>
              <span className="text-primary">₹{total.toFixed(2)}</span>
            </div>

            {/* Payment Methods */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              {['Cash', 'Card', 'UPI'].map(method => (
                <button 
                  key={method} 
                  className={`payment-btn ${paymentMethod === method ? 'active' : ''}`}
                  onClick={() => {
                    setPaymentMethod(method);
                    // Reset verification simulation when switching methods
                    setUpiVerified(false);
                    setCardSwipeSimulated(false);
                    setCashTendered('');
                  }}
                >
                  {method === 'Cash' && <i className="fa-solid fa-money-bill-1-wave"></i>}
                  {method === 'Card' && <i className="fa-solid fa-credit-card"></i>}
                  {method === 'UPI' && <i className="fa-solid fa-mobile-screen-button"></i>}
                  <div style={{ fontSize: '0.8rem', marginTop: '4px', fontWeight: '600' }}>{method}</div>
                </button>
              ))}
            </div>

            {/* Simulated Payment Details Panels */}
            {cart.length > 0 && (
              <>
                {paymentMethod === 'Cash' && (
                  <div className="payment-details-panel">
                    <h4 style={{ fontSize: '12px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Cash Calculator</h4>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <input 
                        type="number" 
                        className="input-glass" 
                        placeholder="Cash Tendered (₹)" 
                        value={cashTendered} 
                        onChange={(e) => setCashTendered(e.target.value)} 
                        style={{ flex: 1 }}
                      />
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Change Due</div>
                        <div style={{ 
                          fontSize: '14px', 
                          fontWeight: 'bold', 
                          color: (parseFloat(cashTendered) || 0) >= total ? 'var(--success)' : 'var(--danger)' 
                        }}>
                          ₹{Math.max((parseFloat(cashTendered) || 0) - total, 0).toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <div className="cash-notes-selector">
                      {[100, 200, 500, 2000].map(note => (
                        <button 
                          key={note} 
                          className="note-btn"
                          onClick={() => {
                            const current = parseFloat(cashTendered) || 0;
                            setCashTendered((current + note).toString());
                          }}
                        >
                          +₹{note}
                        </button>
                      ))}
                      <button 
                        className="note-btn" 
                        style={{ color: 'var(--danger)', borderColor: 'rgba(217,4,41,0.2)' }}
                        onClick={() => setCashTendered('')}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'Card' && (
                  <div className="payment-details-panel">
                    <div className="card-terminal">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <h4 style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Simulated Card Terminal</h4>
                        <span className={`badge ${cardSwipeSimulated ? 'badge-success' : 'badge-warning'}`}>
                          {cardSwipeSimulated ? 'Card Accepted' : 'Insert / Swipe Card'}
                        </span>
                      </div>
                      <div className="card-input-row">
                        <input type="text" className="input-glass" placeholder="Card Number (•••• •••• •••• ••••)" disabled style={{ flex: 1, letterSpacing: '2px', background: 'rgba(255,255,255,0.01)' }} />
                        <input type="text" className="input-glass" placeholder="CVV" disabled style={{ width: '55px', background: 'rgba(255,255,255,0.01)' }} />
                      </div>
                      <button 
                        className={`btn ${cardSwipeSimulated ? 'btn-outline' : 'btn-primary'} btn-block`} 
                        onClick={simulateSwipeCard}
                        disabled={cardSwipeSimulated}
                        style={{ fontSize: '11px', padding: '8px' }}
                      >
                        <i className="fa-solid fa-credit-card"></i> {cardSwipeSimulated ? 'Terminal Approved ✓' : 'Simulate Card Insertion/Swipe'}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'UPI' && (
                  <div className="payment-details-panel">
                    <div className="qr-container">
                      <div className="qr-scanner-box">
                        {!upiVerified && <div className="qr-scan-line"></div>}
                        <svg viewBox="0 0 100 100" style={{ background: '#fff', padding: '2px', width: '100%', height: '100%' }}>
                          <rect x="0" y="0" width="25" height="25" fill="#000" />
                          <rect x="4" y="4" width="17" height="17" fill="#fff" />
                          <rect x="8" y="8" width="9" height="9" fill="#000" />
                          <rect x="75" y="0" width="25" height="25" fill="#000" />
                          <rect x="79" y="4" width="17" height="17" fill="#fff" />
                          <rect x="83" y="8" width="9" height="9" fill="#000" />
                          <rect x="0" y="75" width="25" height="25" fill="#000" />
                          <rect x="4" y="79" width="17" height="17" fill="#fff" />
                          <rect x="8" y="83" width="9" height="9" fill="#000" />
                          <rect x="30" y="4" width="10" height="5" fill="#000" />
                          <rect x="45" y="8" width="5" height="15" fill="#000" />
                          <rect x="55" y="0" width="5" height="10" fill="#000" />
                          <rect x="30" y="18" width="10" height="10" fill="#000" />
                          <rect x="0" y="30" width="5" height="15" fill="#000" />
                          <rect x="8" y="40" width="15" height="10" fill="#000" />
                          <rect x="12" y="30" width="10" height="5" fill="#000" />
                          <rect x="30" y="30" width="30" height="30" fill="#000" />
                          <rect x="35" y="35" width="20" height="20" fill="#fff" />
                          <rect x="40" y="40" width="10" height="10" fill="#000" />
                          <rect x="65" y="30" width="15" height="5" fill="#000" />
                          <rect x="70" y="40" width="25" height="15" fill="#000" />
                          <rect x="85" y="30" width="10" height="5" fill="#000" />
                          <rect x="30" y="65" width="5" height="20" fill="#000" />
                          <rect x="40" y="70" width="20" height="10" fill="#000" />
                          <rect x="50" y="80" width="15" height="15" fill="#000" />
                          <rect x="70" y="65" width="20" height="5" fill="#000" />
                          <rect x="75" y="75" width="10" height="20" fill="#000" />
                        </svg>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Scan UPI QR Code to Pay</div>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-primary)', marginTop: '2px' }}>₹{total.toFixed(2)}</div>
                      </div>
                      <button 
                        className={`btn ${upiVerified ? 'btn-outline' : 'btn-primary'} btn-block`}
                        onClick={simulateVerifyUPI}
                        disabled={upiVerified || isVerifyingUPI}
                        style={{ fontSize: '11px', padding: '8px' }}
                      >
                        {isVerifyingUPI ? (
                          <><i className="fa-solid fa-spinner fa-spin"></i> Checking UPI Server...</>
                        ) : upiVerified ? (
                          <><i className="fa-solid fa-circle-check" style={{ color: 'var(--success)' }}></i> UPI Payment Verified ✓</>
                        ) : (
                          <><i className="fa-solid fa-mobile-screen-button"></i> Verify Payment Status</>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            <button className="btn btn-primary btn-block" style={{ height: '52px', fontSize: '1.1rem', borderRadius: '12px', marginTop: '8px', boxShadow: '0 4px 16px rgba(255, 107, 53, 0.25)' }} onClick={handleCheckout}>
              <i className="fa-solid fa-cash-register" style={{ marginRight: '8px' }}></i> Checkout (₹{total.toFixed(2)})
            </button>
          </div>
        </div>

      </section>

      {/* Digital Thermal Invoice Modal */}
      {isReceiptOpen && (
        <div className="receipt-overlay">
          <div className="thermal-receipt">
            <div className="receipt-header">
              <h2>Martinoz Pizza</h2>
              <p>Martinoz Corporate HQ</p>
              <p>Ph: +91 98765 43210</p>
              <p>GSTIN: 27AAAAA1111A1Z1</p>
            </div>
            
            <div className="receipt-divider-dashed"></div>
            
            <table className="receipt-details-table">
              <tbody>
                <tr>
                  <td><strong>Receipt:</strong> {receiptNumber}</td>
                  <td style={{ textAlign: 'right' }}><strong>Type:</strong> {orderType}</td>
                </tr>
                <tr>
                  <td><strong>Date:</strong> {new Date().toLocaleDateString()}</td>
                  <td style={{ textAlign: 'right' }}><strong>Time:</strong> {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
                {orderType === 'Dine-In' && (
                  <tr>
                    <td><strong>Table:</strong> {tableNumber}</td>
                    <td style={{ textAlign: 'right' }}><strong>Pax:</strong> {paxCount}</td>
                  </tr>
                )}
                {orderType === 'Takeaway' && (
                  <tr>
                    <td colSpan="2"><strong>Pickup Time:</strong> {pickupTime}</td>
                  </tr>
                )}
                {orderType === 'Delivery' && (
                  <tr>
                    <td><strong>Partner:</strong> {deliveryPartner}</td>
                    <td style={{ textAlign: 'right' }}><strong>Status:</strong> Dispatched</td>
                  </tr>
                )}
                <tr>
                  <td colSpan="2"><strong>Cashier:</strong> Admin Control</td>
                </tr>
                <tr>
                  <td colSpan="2"><strong>Customer:</strong> {customerInfo.name || 'Walk-in Guest'} ({customerInfo.phone || 'N/A'})</td>
                </tr>
                {orderType === 'Delivery' && (
                  <tr>
                    <td colSpan="2" style={{ fontSize: '10px' }}><strong>Address:</strong> {deliveryAddress}</td>
                  </tr>
                )}
              </tbody>
            </table>
            
            <div className="receipt-divider-dashed"></div>
            
            <div className="receipt-items-list">
              {cart.map(item => {
                const addonsPrice = (item.selectedAddons || []).reduce((sum, a) => sum + a.price, 0);
                const itemTotal = (item.price + addonsPrice) * item.qty;
                return (
                  <div key={item.id}>
                    <div className="receipt-item-row">
                      <span>{item.qty} x {item.name}</span>
                      <span>₹{itemTotal.toFixed(2)}</span>
                    </div>
                    {item.selectedAddons && item.selectedAddons.length > 0 && (
                      <div className="receipt-item-addons-list">
                        + {item.selectedAddons.map(a => `${a.name} (₹${a.price})`).join(', ')}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="receipt-divider-dashed"></div>
            
            <div className="receipt-totals">
              <div className="receipt-total-row">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {serviceCharge > 0 && (
                <div className="receipt-total-row">
                  <span>Service Charge (5%)</span>
                  <span>₹{serviceCharge.toFixed(2)}</span>
                </div>
              )}
              
              {totalDiscount > 0 && (
                <div className="receipt-total-row">
                  <span>Discounts</span>
                  <span>-₹{totalDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="receipt-total-row">
                <span>GST (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              
              <div className="receipt-total-row grand-total">
                <span>GRAND TOTAL</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              
              <div className="receipt-total-row" style={{ marginTop: '8px', fontSize: '10.5px' }}>
                <span>Paid via: {paymentMethod.toUpperCase()}</span>
                {paymentMethod === 'Cash' && (
                  <span>Tendered: ₹{(parseFloat(cashTendered) || total).toFixed(2)}</span>
                )}
              </div>
            </div>
            
            <div className="receipt-barcode">
              <i className="fa-solid fa-barcode"></i>
              <span>* {receiptNumber} *</span>
              <p style={{ marginTop: '10px', fontSize: '10px' }}>Thank you for dining with us!</p>
            </div>
            
            <div className="receipt-actions">
              <button className="receipt-btn-print" onClick={handlePrintReceipt}>
                <i className="fa-solid fa-print"></i> Print Invoice
              </button>
              <button className="receipt-btn-close" onClick={handleReceiptConfirm}>
                Confirm & Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
