
# Sessionizing - Home Assignment

This project is a backend system designed for analyzing page views of visitors to web sites and
provides info about visitor sessions

## Features

- **Pre-processing:** The system loads the data from the provided csv files, processes them to a queryable data structures and stores the values in an in memory variables .
- **Querying Rest API :** The app utilizes an express server to expose a REST API for querying the data

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- Docker installed on your machine
- Internet connection for installing dependencies

## Setup Instructions

1. **build**   
on the root of the project (where the Dockerfile is located) run:   
` docker build -t sw_demo .`    
   To create an image of the project.    
2. **Run**   
   run `docker run -p 3000:3000 sw_demo`   

All set, the server should listen to requests on port 3000. 

## Notes:
- There is an http file in the root of the project that demonstrate the api routes usage. Feel free to test with it and adjust the parameters. 

## Scalability  
As the assignment suggests, the data is stored in memory which is a problem at scale.     
To allow for reliable scaling i would suggest using a DB to store the data and allow for mutations on the records and data  durability. Choosing the right database for this kind of data is important to keep the query times efficient.    
Database that efficiently supports time-series data can be beneficial because they are optimized for storing and querying data that changes over time and time related object relations. I personally have an experience with InfluxDB which is a perfect fit. I also know that Cassandra have a time based feature set that can be handy. it's important to remember that migrating to a database solution requires careful planning to minimize latency and keep data integrity especially if there is a need for a distributed solution to store massive amounts of data.      

Indexing can also play a role on these kinds oh queries and some ideas are:   
Obviously an index on timestamp can be beneficial here (which is automatically done on time based dbs)  to help with time based data fetching. Indexing on the visitor field can also increase efficiency on the visitor based queries.    
Another way to spread the data to more manageable chunks is partitioning, particularly time based partitioning is a good idea to keep relevant data records close to each other.   
Caching can be added to the system to boost query times by storing frequently accessed query results, reducing database load and improving response times. Using in-memory caching solutions like Redis, we can serve popular analytics rapidly.    

## General description
The system initiates 2 main data structures for efficient querying :    
- visitorUniqueSites: Used to store unique site visits for each user. Utilizes a `Map<string, Set<string>>` to keep lookups and inserts efficient as well as duplicate site handling by the Set data type.    
- sessionsBySite: Used to store session data of each site to make the querying quick later on, it is of type Map<string, Session[]> to have a O(1) lookup time.    


## Space and time complexity analysis   
### Preprocessing   
The system starts to preprocess as it boots and exposes the rest api only when the data is available.    
- `loadDataFromCSV` function: This function loads the data from all csv files, sorts it by timestamp and then builds a data structure to store the processing results for querying later.    
the time complexity on this function is O(n log n) where n is the num of records on the 3 csv files.    
the most massive operation (in the worst case) is the sorting. this can be improved upon by a sorting algorithm that takes into account the fact that the files are internally sorted which can be implemented in O(n) (i didn't implement one because of time considerations. but something like a k-way merge sort can be used)    
After the loading and sorting the data the functions determines the different sessions done by users. It uses an algorithm in the func `calcSessions` to identify the unique sessions and stores them for querying.     
    
- `visitorUniqueSites` Map: This var stores the unique sites each user visited to make querying this data efficient. it grows linearly and can be at worst case O(users X sites).    
- `sessionsBySite` Map: This map stores sessions for each site, with each session having a start and end timestamp and associated visitor ID. The space complexity is O(N), as each session is stored once and contains only primitive fields.    
- `latsSessionsBySiteByUser` Map: This var is used in the preprocessing stage and gets freed after so it doesn't have an effect on space long term, but can cause a spike during the processing stage. It is used to 'remember' the last relevant session during the session processing and can grow in the worst case to O(S X U) where S is the unique sites amount and U is the num of unique users.    
    
### Querying 
- `num_sessions` route : This endpoint retrieves the number of sessions for a given site URL by accessing a precomputed `sessionsBySite` map in the `AnalyticsDataLoader`. The performance of this operation is largely O(1), assuming hash map access times, making it efficient even as the number of sites grows.    

- `median_session_len` route : Computing the median session length requires fetching an array of session lengths for the specified site, sorting it, and then finding the median value. The sorting operation has a time complexity of O(N log N), where N is the number of sessions for the site. This could become a performance issue if a site has a large number of sessions. optimizations might be caching sorted lengths or using more efficient statistics calculation techniques that do not require full sorting.    
- `num_unique_visited_sites` route:  This endpoint looks up the number of unique sites visited by a specific visitor. The operation is O(1) with respect to access time of the `Map` and `Set`.        
