
CREATE TABLE users (
    id uuid PRIMARY KEY,
    email text,
    user_name text,
    password text,
    locale text,
    first_name text,
    last_name text,
    picture text,
);

CREATE INDEX ON users(email);
CREATE INDEX ON users(user_name);


CREATE TYPE card_cover (
    picture text,
    title text,
);

CREATE TYPE card_module (
    kind text,
    data text,
);

CREATE TABLE users_cards (
    user_id uuid,
    card_id uuid,
    main boolean,
    cover frozen<card_cover>,
    modules list<frozen<card_module>>,
    PRIMARY KEY (user_id, card_id)
);
