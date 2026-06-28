"use client";

const WAIVER_TEXT =
  "By booking, the signer (18+) accepts responsibility for everyone in their party, including children and pets. Ice fishing and being on a frozen lake carry real risks — unpredictable ice, extreme cold, frostbite, slips and falls, drowning, and driving or parking on the ice at your own risk. You release Kozy Hole Ice Shack Rentals and its owners from claims for injury, loss, or damage. You agree to use the propane furnace, backup heater, stove, and BBQ safely and to keep the CO/smoke alarms and fire extinguisher clear. You will hold a valid Alberta fishing license and follow all regulations and limits. You won't exceed the cabin's maximum occupancy. You're responsible for damage and accept the $500 damage deposit, covering anything beyond it. If bringing a dog, you agree to clean up, supervise it, and the $50 pet fee. You've read the check-in (1 PM) / check-out (11 AM) times and the cancellation policy (1 week notice for a credit, no refunds).";

type Props = {
  partySize: number;
  partyMembers: string[];
  onPartyMembersChange: (members: string[]) => void;
  agreed: boolean;
  onAgreedChange: (v: boolean) => void;
};

export default function WaiverBox({
  partySize,
  partyMembers,
  onPartyMembersChange,
  agreed,
  onAgreedChange,
}: Props) {
  function updateMember(index: number, value: string) {
    const updated = [...partyMembers];
    updated[index] = value;
    onPartyMembersChange(updated);
  }

  // Ensure we have exactly partySize slots
  const slots = Array.from({ length: partySize }, (_, i) => partyMembers[i] ?? "");

  return (
    <div className="flex flex-col gap-5">
      {/* Waiver text */}
      <div className="max-h-48 overflow-y-auto rounded-xl border border-hairline bg-surface p-4 text-sm leading-relaxed text-muted scrollbar-thin">
        <p>{WAIVER_TEXT}</p>
        <p className="mt-3 text-xs text-faint">
          Final waiver wording subject to confirmation.
        </p>
      </div>

      {/* Party member names */}
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-ink">
          Party members (one per person in your group)
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {slots.map((name, i) => (
            <input
              key={i}
              type="text"
              placeholder={`Member ${i + 1} full name`}
              value={name}
              onChange={(e) => updateMember(i, e.target.value)}
              className="h-11 rounded-xl border border-hairline bg-surface-2 px-4 text-sm text-ink placeholder:text-faint focus:border-ice/60 focus:outline-none focus:ring-1 focus:ring-ice/30"
            />
          ))}
        </div>
      </div>

      {/* Agreement checkbox */}
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => onAgreedChange(e.target.checked)}
          required
          className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer rounded border border-hairline accent-ice focus:outline-none"
        />
        <span className="text-sm leading-relaxed text-muted">
          I have read and agree to the release of liability and rental conditions above.{" "}
          <span className="text-ice">*</span>
        </span>
      </label>
    </div>
  );
}
