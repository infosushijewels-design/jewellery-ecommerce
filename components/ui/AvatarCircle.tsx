import { initialsFor } from '@/lib/initials';

interface AvatarCircleProps {
  avatarUrl: string | null;
  fullName: string | null;
  /** Diameter in px. */
  size: number;
  isUploading?: boolean;
  showCameraBadge?: boolean;
  onClick?: () => void;
  className?: string;
}

/** A photo (if uploaded), else gold-on-cream initials, else a generic person icon.
 *  The whole circle (including the camera badge) is one click target when `onClick` is given. */
export default function AvatarCircle({
  avatarUrl,
  fullName,
  size,
  isUploading,
  showCameraBadge,
  onClick,
  className = '',
}: AvatarCircleProps) {
  const initials = initialsFor(fullName);

  const content = (
    <>
      {avatarUrl ? (
        <img src={avatarUrl} alt={fullName || 'Profile photo'} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center bg-secondary/15 text-secondary font-semibold"
          style={{ fontSize: size * 0.36 }}
        >
          {initials || <span className="material-symbols-outlined" style={{ fontSize: size * 0.5 }}>person</span>}
        </div>
      )}
      {isUploading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="material-symbols-outlined text-white animate-spin" style={{ fontSize: size * 0.4 }}>
            progress_activity
          </span>
        </div>
      )}
      {showCameraBadge && !isUploading && (
        <span
          className="absolute bottom-0 right-0 bg-primary text-surface rounded-full flex items-center justify-center border-2 border-[#FAF7F2]"
          style={{ width: size * 0.36, height: size * 0.36 }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: size * 0.2 }}>photo_camera</span>
        </span>
      )}
    </>
  );

  const circleClass = `relative flex-shrink-0 rounded-full overflow-hidden border border-[#E8D5C5] ${className}`;
  const style = { width: size, height: size };

  if (!onClick) {
    return (
      <div className={circleClass} style={style}>
        {content}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Change profile photo"
      className={`${circleClass} cursor-pointer`}
      style={style}
    >
      {content}
    </button>
  );
}
