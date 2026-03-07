const colorMap = {
  bus: 'bg-bus/15 text-bus border-bus/30',
  cantine: 'bg-cantine/15 text-cantine border-cantine/30',
  garderie: 'bg-garderie/15 text-garderie border-garderie/30',
  recreation: 'bg-recreation/15 text-recreation border-recreation/30',
  classe: 'bg-classe/15 text-classe border-classe/30'
};

export default function LocationBadge({ location, label }) {
  const classes = colorMap[location] || colorMap.classe;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-semibold border ${classes}`}>
      {label}
    </span>
  );
}
