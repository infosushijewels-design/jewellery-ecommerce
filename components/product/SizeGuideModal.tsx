'use client';

import Modal from '@/components/ui/Modal';

const ringSizeChart = [
  { in: '10', mm: '16.5', circumference: '51.9' },
  { in: '12', mm: '17.3', circumference: '54.4' },
  { in: '14', mm: '18.1', circumference: '56.9' },
  { in: '16', mm: '18.9', circumference: '59.4' },
  { in: '18', mm: '19.8', circumference: '62.1' },
  { in: '20', mm: '20.6', circumference: '64.6' },
];

interface SizeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SizeGuideModal({ isOpen, onClose }: SizeGuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Find Your Ring Size">
      <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed mb-5">
        Measure the inner diameter of a ring that fits you well, or wrap a strip of paper around your finger and measure the circumference. Match it to the Indian size below.
      </p>
      <div className="overflow-x-auto rounded-xl border border-outline-variant/40">
        <table className="w-full text-left text-body-sm font-body-sm">
          <thead>
            <tr className="bg-surface-container-low text-label-sm font-label-sm uppercase text-on-surface-variant">
              <th className="py-2.5 px-4">Indian Size</th>
              <th className="py-2.5 px-4">Diameter (mm)</th>
              <th className="py-2.5 px-4">Circumference (mm)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {ringSizeChart.map((row) => (
              <tr key={row.in}>
                <td className="py-2.5 px-4 font-semibold text-primary">{row.in}</td>
                <td className="py-2.5 px-4 text-on-surface-variant">{row.mm}</td>
                <td className="py-2.5 px-4 text-on-surface-variant">{row.circumference}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-start gap-2.5 bg-surface-container-low rounded-xl p-4 border border-secondary/30">
        <span className="material-symbols-outlined text-secondary text-[20px]">videocam</span>
        <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
          Still unsure? Book a complimentary 1-on-1 virtual consultation with our Master Gemologists for a precise fitting.
        </p>
      </div>
    </Modal>
  );
}
