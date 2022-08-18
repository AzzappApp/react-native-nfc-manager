
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


CREATE TYPE media (
    kind text,
    source text,
    ratio float
);

CREATE TYPE card_cover (
    background_color text,
    pictures list<frozen<media>>,
    picture_transition_timer smallint,
    overlay_effect text,
    title text,
    title_position text,
    title_font text,
    title_font_size smallint,
    title_color text,
    title_rotation smallint,
    qr_code_position text,
    desktop_layout text,
    dektop_image_position text
);

CREATE TYPE card_module (
    kind text,
    data text
);

CREATE TABLE users_cards (
    user_id uuid,
    card_id uuid,
    main boolean,
    cover frozen<card_cover>,
    modules list<frozen<card_module>>,
    PRIMARY KEY (user_id, card_id)
);

CREATE TABLE posts (
    author_id uuid,
    post_id uuid,
    post_date timestamp,
    media frozen<media>,
    content text,
    allow_comments boolean,
    allow_likes boolean,
    PRIMARY KEY (author_id, post_date, post_id)
)
WITH CLUSTERING ORDER BY (post_date DESC);

CREATE INDEX ON posts(post_id);

CREATE TABLE followers (
    follower_id uuid,
    following_id uuid,
    follow_date timestamp,
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX ON followers(following_id);
