# RoadLabel Tool

HTML5, Canvas tool to annotate images with road lane markings. \
Road markings can be downloaded in the form of JSON and used to train deep neural network for lane extraction.

<i>This labelling framework has been developed within the Make2Learn and Innovate Workshop sponsered by Federal Ministry of Education and Research of Germany (BMBF) of <a href="https://www.photonikforschung.de/projekte/open-innovation/projekt/morphoa.html"> Morphoa-Project</a>.</i>

![alt text](https://github.com/AVESREALITY/RoadLabel/blob/9af14c79e85e50760e00dc8dfa69f74b1e72ad85/labeling%20Tool.JPG 'Preview')
## Setup


## 1) Create Database Structure:

### Table Annotations

| Spalte | Typ | Null | Standard | Kommentare |
| --- | --- | --- | --- | --- |
| ID _(Primärschlüssel)_ | int(11) | Nein |     |     |
| Image | varchar(255) | Nein |     |     |
| Modified | timestamp | Nein | current_timestamp() |     |
| Annotation | longtext | Ja  | _NULL_ |     |


### Table Datasets
--------

| Spalte | Typ | Null | Standard | Kommentare |
| --- | --- | --- | --- | --- |
| ID _(Primärschlüssel)_ | int(11) | Nein |     |     |
| Description | varchar(255) | Nein |     |     |
| Created | timestamp | Nein | current_timestamp() |     |

## 2) Enter database credentials into backend/index.php
