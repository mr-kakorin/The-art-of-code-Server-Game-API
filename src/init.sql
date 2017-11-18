create database if not exists
    TheArtOfCode
        default CHARACTER set utf8
        default COLLATE utf8_general_ci;

use `TheArtOfCode`;

drop table if exists users;
drop table if exists heroes;
drop table if exists inventory;
drop table if exists objects;

create table users (
    id int unsigned not null auto_increment,
    login varchar(60) not null,
    password varchar(60) not null,
    heroId int unsigned,
    docker varchar(60) not null,
    accessToken varchar(60) not null,
    primary key (id)
);

create table heroes (
    id int unsigned not null auto_increment,
    login varchar(60) not null,
    userId int unsigned not null,
    positionX int unsigned not null,
    positionY int unsigned not null,
    location varchar(60) not null,
    HP decimal(5,2) not null,
    maxHP decimal(6,2) not null,
    attack int unsigned not null,
    defence int unsigned not null,
    exp int unsigned not null,
    lvl int unsigned not null,
    primary key (id)
);

create table inventory (
    id int unsigned not null auto_increment,
    heroId int unsigned not null,
    quantity int not null,
    type varchar(60) not null,
    name varchar(60) not null,
    primary key (id)
);

create table objects (
    id int unsigned not null auto_increment,
    positionX int unsigned not null,
    positionY int unsigned not null,
    type varchar(60) not null,
    name varchar(60) not null,
    primary key (id)
);

set global max_prepared_stmt_count=1000000;