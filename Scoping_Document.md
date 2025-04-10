# Welcome on our Scoping Documents :

### Problem Statement 

What problem are you addressing? : 

Paris has implemented a bike-sharing system (Vélib’) to promote sustainable transportation. However, users often face issues such as empty or overcrowded stations. Our goal is to analyze historical and hourly data to detect patterns in bike availability across time and location, in order to understand how the system is used and how it can be improved.

### Target Audience

Who is your primary audience?
	•	Urban mobility planners
	•	Vélib’ users
	•	Data science students/researchers interested in public transportation data

What tasks will they perform using your visualization?
	•	Identify over- or under-utilized stations
	•	Understand hourly and daily patterns in bike demand
	•	Analyze the distribution of mechanical vs. electric bikes

How will your visualization be helpful for them?
	•	For city planners: inform strategies to rebalance stations more effectively
	•	For users: help them better plan their routes and predict station availability
	•	For students: offer a concrete example of real-world data analysis and visualization


### Related Work

Identify three related projects or visualizations. Explain how they inspire or differ from your approach.

We took inspiration from existing visualizations such as [MBTA Data Visualizations](http://mbtaviz.github.io/), which demonstrate how urban mobility data can be effectively communicated through simple and clear visuals.  
We also drew inspiration for the design of our website from the [Apple Website](https://www.apple.com), and you’ll notice a similar minimalist effect on our site.
Finally we inspired ourselves from the [Velib website](https://www.velib-metropole.fr) for all the colors of the website, to stay in the same theme
However, we also developed many of our own ideas and showed creativity throughout the project, especially in how we merged hourly data and visualized station-level patterns.

### Data Sources

Dataset(s):
	•	Main dataset: hourly Vélib’ station availability (from [here](https://transport.data.gouv.fr/datasets/velib-velos-et-bornes-disponibilite-temps-reel))
	•	Format: CSV
	•	Type: unstructured (CSV-based), structured during preprocessing using Pandas

Strengths:
	•	Open access
	•	Real-time and historical
	•	Geolocation + bike availability (mechanical/electric)

Limitations:
	•	Requires merging multiple files manually
	•	Missing values or station mismatches across files

Backup Plan:
If data is incomplete or inaccessible, we plan to simulate a simplified dataset by selecting a limited number of stations and generating usage patterns based on past averages.

Exploratory Data Analysis:
	•	Understanding the structure and content of CSV files
	•	Inspecting columns such as station name, location, and bike counts
	•	Analyzing bike availability trends across hours

Data Cleansing & Wrangling:
	•	Merged hourly datasets into one consolidated CSV
	•	Handled missing values with Pandas (fillna, drops)
	•	Removed duplicate rows
	•	Normalized station names/IDs for consistency ...

### Team Organization

Communication & Collaboration:
	•	Communication through social media, in-person meetings, and video conferencing.	
	•	Shared development environment using GitHub repository with Github Desktop

Team Roles:
	• Gabriel Enthoven – Software Developer
	• Yanis Montacer – Full Stack Developer
	• Gabriel Gaslain – Data Analyst

Participation Tracking:
	•	All members actively contribute to the GitHub repository
	•	README includes role descriptions for transparency
	• 	For the design part, we decided together to go on some bright colors that could recall our theme which is above all sustainability
