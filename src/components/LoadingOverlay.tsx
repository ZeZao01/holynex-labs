import logo from "@/assets/logo-loading.png";

type LoadingOverlayProps = {
  active?: boolean;
  label?: string;
};

export default function LoadingOverlay({ active = false, label = "Carregando" }: LoadingOverlayProps) {
  if (!active) return null;

  return (
    <div className="loading-overlay" role="status" aria-live="polite" aria-busy="true">
      <div className="loading-phoenix" aria-hidden="true">
        <img className="loading-phoenix-img" src={logo} alt="HolyNex" />
      </div>
      <div className="loading-text">{label}</div>
    </div>
  );
}
