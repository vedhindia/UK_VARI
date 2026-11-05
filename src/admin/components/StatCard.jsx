
const StatCard = ({
    title,
    value,
    subtitle,
    icon: Icon
}) => {

    return (

        <div className="stat-card">

            <div className="stat-card-top">

                <div>

                    <p>{title}</p>

                    <h2>{value}</h2>

                </div>

                <div className="stat-icon">
                    <Icon size={24} />
                </div>

            </div>

            <span className="stat-subtitle">
                {subtitle}
            </span>

        </div>
    );
};

export default StatCard;
