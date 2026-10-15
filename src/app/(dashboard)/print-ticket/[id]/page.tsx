'use client';

import { useEffect } from 'react';

export default function PrintTicketPage({ params }: { params: { id: string } }) {
  // Trigger print dialog once the DOM is fully rendered
  useEffect(() => {
    // Small timeout ensures styles, fonts, and assets are fully painted
    const timer = setTimeout(() => {
      window.print();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="ticket-container p-6 bg-white text-black font-sans">
      <div className="border border-black p-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-center border-b pb-2">
          Electronic Reservation Slip (ERS)
        </h1>
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Ticket ID:</strong> {params.id}
          </div>
          <div>
            <strong>Status:</strong> Confirmed
          </div>
        </div>

        {/* Your Ticket Content / Table Here */}
      </div>

      {/* Print-specific CSS */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0;
            padding: 0;
          }
          /* Hide standard layout headers/footers if any exist */
          header, footer, nav {
            display: none !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}