import React from 'react';
import { MapPin, Mail, Phone } from 'lucide-react';

const FooterSection = () => {
  return (
    <footer className="w-full bg-[#0a0a0a] text-white pt-10 pb-6 px-4 sm:px-6 lg:px-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        
        {/* Brand */}
        <div className="lg:col-span-2">
          <h2 className="text-3xl font-black italic tracking-widest text-white mb-4">
            TAXI09
          </h2>
          <p className="text-gray-400 text-sm max-w-sm mb-6">
            Your trusted partner for premium bike and car rentals. Ride more, worry less.
          </p>
          <div className="flex gap-4">
            <a href="#" className="w-8 h-8 rounded-full bg-[#FFC107] text-black flex items-center justify-center hover:bg-amber-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#FFC107] text-black flex items-center justify-center hover:bg-amber-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
            </a>
            <a href="#" className="w-8 h-8 rounded-full bg-[#FFC107] text-black flex items-center justify-center hover:bg-amber-400 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>
        </div>

        {/* Links 1 */}
        <div>
          <h4 className="font-bold mb-4 text-white">Company</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-[#FFC107] transition-colors">About Us</a></li>
            <li><a href="#" className="hover:text-[#FFC107] transition-colors">Careers</a></li>
            <li><a href="#" className="hover:text-[#FFC107] transition-colors">Blog</a></li>
            <li><a href="#" className="hover:text-[#FFC107] transition-colors">Newsroom</a></li>
          </ul>
        </div>

        {/* Links 2 */}
        <div>
          <h4 className="font-bold mb-4 text-white">Rentals</h4>
          <ul className="space-y-2 text-sm text-gray-400">
            <li><a href="#" className="hover:text-[#FFC107] transition-colors">2 Wheeler Rentals</a></li>
            <li><a href="#" className="hover:text-[#FFC107] transition-colors">4 Wheeler Rentals</a></li>
            <li><a href="#" className="hover:text-[#FFC107] transition-colors">All Vehicles</a></li>
            <li><a href="#" className="hover:text-[#FFC107] transition-colors">Popular Rentals</a></li>
          </ul>
        </div>

        {/* Links 3 */}
        <div>
          <h4 className="font-bold mb-4 text-white">Contact Us</h4>
          <ul className="space-y-4 text-sm text-gray-400">
            <li className="flex items-start gap-3">
              <Phone size={16} className="text-[#FFC107] mt-0.5" />
              <span>+91 98765 43210</span>
            </li>
            <li className="flex items-start gap-3">
              <Mail size={16} className="text-[#FFC107] mt-0.5" />
              <span>support@taxi09.com</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin size={16} className="text-[#FFC107] mt-0.5 flex-shrink-0" />
              <span>123, MG Road, Bangalore,<br/>Karnataka 560001</span>
            </li>
          </ul>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/10 text-center text-sm text-gray-500 flex flex-col md:flex-row items-center justify-between">
        <p>© 2026 TAXI09. All Rights Reserved.</p>
        <div className="flex gap-4 mt-4 md:mt-0">
          <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
