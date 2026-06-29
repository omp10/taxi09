const fs = require('fs');
const path = 'd:\\\\taxi09\\\\frontend\\\\src\\\\modules\\\\user\\\\pages\\\\rental\\\\BikeRentalHome.jsx';
let content = fs.readFileSync(path, 'utf8');

// Find the last index of "  return ("
const returnIndex = content.lastIndexOf('  return (');
if (returnIndex !== -1) {
  const newContent = content.substring(0, returnIndex) + `  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] font-sans no-scrollbar overflow-y-auto overflow-x-hidden">
      <HeaderGreeting />
      <BottomNavbar />

      {/* Hero Section */}
      <div className="relative pt-24 md:pt-32 pb-32 md:pb-48 px-4 md:px-12 bg-cover bg-center w-full" style={{ backgroundImage: \\\`url('https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop')\\\` }}>
        <div className="absolute inset-0 bg-black/50 md:bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
        
        <div className="relative z-10 max-w-6xl mx-auto flex flex-col md:flex-row items-center h-full">
          <div className="w-full md:w-1/2 pt-10 md:pt-0">
            <div className="border-l-[6px] border-[#FFC107] pl-4 md:pl-6 mb-8">
              <h1 className="text-4xl md:text-[64px] font-black text-white leading-[1.1] tracking-tight uppercase">
                Your Ride.<br />Your Way.
              </h1>
              <h2 className="text-4xl md:text-[64px] font-black text-[#FFC107] leading-[1.1] tracking-tight uppercase mt-2">
                TAXI09.
              </h2>
            </div>
          </div>
          <div className="hidden md:flex w-1/2 justify-end relative">
             <img src={rentalCarImg} alt="Taxi" className="w-[120%] max-w-[700px] object-contain drop-shadow-2xl translate-x-12 translate-y-8" />
          </div>
        </div>
      </div>

      {/* Booking Form overlaying Hero */}
      <div className="relative z-20 max-w-5xl mx-auto px-4 -mt-20 md:-mt-28 w-full mb-10">
        <div className="bg-[#fcfcfc] rounded-[24px] shadow-2xl p-6 md:p-8">
          
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="h-[2px] w-10 bg-[#FFC107]"></div>
            <h3 className="text-2xl font-black text-black">Book Your Taxi</h3>
            <div className="h-[2px] w-10 bg-[#FFC107]"></div>
          </div>

          {/* Vehicle Tabs */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            {['Mini', 'Sedan', 'SUV', 'Prime'].map((type, i) => (
              <button key={type} className={\`flex items-center gap-2 px-6 py-2.5 rounded-[12px] text-[14px] font-bold transition-all shadow-sm \${i === 0 ? 'bg-[#FFC107] text-black border border-[#FFC107]' : 'bg-white text-black border border-gray-200 hover:border-gray-300'}\`}>
                <Car size={16} /> {type}
              </button>
            ))}
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Left Inputs side */}
            <div className="flex-1 flex flex-col gap-4 relative">
              {/* Swap Button (Desktop Center Absolute) */}
              <div className="hidden lg:flex absolute left-1/2 top-[13%] -translate-x-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-gray-200 rounded-full items-center justify-center shadow-sm cursor-pointer hover:bg-gray-50">
                <ArrowDownUp size={16} className="text-black" />
              </div>

              {/* Row 1: Locations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <MapPin size={20} className="text-green-500" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Pickup Location</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">Bhubaneswar</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <MapPin size={20} className="text-red-500" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Drop Location</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">Where to?</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Dates */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <Calendar size={20} className="text-black" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Pickup Date</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">2026-06-26</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <Calendar size={20} className="text-black" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Drop Date</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">2026-06-27</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Times */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <Clock size={20} className="text-black" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Pickup Time</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">06:00 PM</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm">
                  <Clock size={20} className="text-black" />
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-400 font-semibold mb-0.5">Drop Time</p>
                    <div className="flex items-center justify-between cursor-pointer">
                      <p className="text-[14px] text-black font-bold">04:00 PM</p>
                      <ChevronDown size={14} className="text-gray-400" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Passenger, Cash, Offers */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm cursor-pointer hover:bg-gray-50">
                  <User size={18} className="text-black" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[14px] text-black font-bold">1 Passenger</p>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm cursor-pointer hover:bg-gray-50">
                  <ClipboardCheck size={18} className="text-black" />
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[14px] text-black font-bold">Cash</p>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-[12px] p-3 shadow-sm cursor-pointer hover:bg-gray-50">
                  <div className="bg-black text-white text-[10px] font-black rounded-sm px-1.5 py-0.5">%</div>
                  <div className="flex-1 flex items-center justify-between">
                    <p className="text-[14px] text-black font-bold">Offers</p>
                    <ChevronDown size={14} className="text-gray-400" />
                  </div>
                </div>
              </div>

            </div>

            {/* Right Yellow Box */}
            <div className="w-full lg:w-[320px] shrink-0 bg-[#FFC107] rounded-[24px] p-8 flex flex-col items-center justify-center text-center shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-10 translate-x-10 pointer-events-none"></div>
              
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mb-6 z-10">
                <CarFront size={32} className="text-[#FFC107]" />
              </div>
              <h4 className="text-2xl font-black text-black mb-3 z-10">Ready to ride?</h4>
              <p className="text-[14px] font-semibold text-black/80 mb-8 leading-relaxed z-10">
                Find the best taxi for your journey in just a few clicks.
              </p>
              <button 
                onClick={() => toast.success("Searching for taxis...")}
                className="w-full bg-black text-white font-bold text-[15px] py-4 rounded-[12px] hover:bg-gray-900 transition-colors shadow-md z-10"
              >
                Find Taxi
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Features Row */}
      <div className="bg-[#111111] border-y border-white/10 mt-auto">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            <div className="flex items-center justify-center md:justify-start gap-4 md:border-r border-white/10 last:border-0 md:px-6">
              <ShieldCheck size={28} className="text-[#FFC107]" />
              <div>
                <p className="text-[13px] font-bold text-white leading-tight">Safe & Secure</p>
                <p className="text-[13px] font-bold text-white leading-tight">Rides</p>
              </div>
            </div>
            
            <div className="flex items-center justify-center md:justify-start gap-4 md:border-r border-white/10 last:border-0 md:px-6">
              <User size={28} className="text-[#FFC107]" />
              <div>
                <p className="text-[13px] font-bold text-white leading-tight">Verified</p>
                <p className="text-[13px] font-bold text-white leading-tight">Drivers</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 md:border-r border-white/10 last:border-0 md:px-6">
              <Headset size={28} className="text-[#FFC107]" />
              <div>
                <p className="text-[13px] font-bold text-white leading-tight">24x7</p>
                <p className="text-[13px] font-bold text-white leading-tight">Support</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-4 md:px-6">
              <div className="w-7 h-7 rounded-full border-2 border-[#FFC107] flex items-center justify-center">
                <span className="text-[#FFC107] font-bold text-[14px]">₹</span>
              </div>
              <div>
                <p className="text-[13px] font-bold text-white leading-tight">Affordable</p>
                <p className="text-[13px] font-bold text-white leading-tight">Fares</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default BikeRentalHome;
`;
  fs.writeFileSync(path, newContent);
  console.log('Successfully updated the file.');
} else {
  console.log('Could not find the return statement to replace.');
}
