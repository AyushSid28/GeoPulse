CREATE TABLE stations(
    id UUID PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    zone VARCHAR(50)
);

CREATE INDEX idx_stations_name ON stations(name);

CREATE TABLE trains(
    id UUID PRIMARY KEY,
    number VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50)
);

CREATE INDEX idx_trains_name ON trains(name);

CREATE TABLE stop_times(
    id UUID PRIMARY KEY,
    train_id UUID NOT NULL,
    station_id UUID NOT NULL,
    sequence INT NOT NULL,
    arrival_time TIME,
    departure_time TIME,
    distance DOUBLE PRECISION,
    platform VARCHAR(20),

    CONSTRAINT fk_train
        FOREIGN KEY(train_id)
        REFERENCES trains(id)
        ON DELETE CASCADE,


    CONSTRAINT fk_station
        FOREIGN KEY(station_id)
        REFERENCES stations(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_train_sequence
        UNIQUE (train_id, sequence)
);

CREATE TABLE route_geometry (
    id UUID PRIMARY KEY,
    train_id UUID NOT NULL UNIQUE,
    geometry JSONB NOT NULL, 
    updated_at TIMESTAMP,

    CONSTRAINT fk_train_route
        FOREIGN KEY(train_id)
        REFERENCES trains(id)
        ON DELETE CASCADE
);





CREATE TABLE alerts(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    train_id UUID NOT NULL REFERENCES trains(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'before_station',
    station_id UUID NOT NULL REFERENCES stations(id) ON DELETE CASCADE,
    minutes_before INT DEFAULT 10,
    triggered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_train_id ON alerts(train_id);








