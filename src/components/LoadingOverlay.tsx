import logo from "@/assets/logo-transparent.png";

type LoadingOverlayProps = {
  active?: boolean;
  label?: string;
};

export default function LoadingOverlay({ active = false, label = "Carregando" }: LoadingOverlayProps) {
  if (!active) return null;

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-logo" aria-hidden="true">
        <span className="loading-wing left" />
        <img className="loading-logo-image" src={logo} alt="Logo" />
        <span className="loading-wing right" />
      </div>
      <div className="loading-text">{label}</div>
    </div>
  );
}
