# Open Agenda API
Open-Agenda is a Software to manage big quantities of collaborative agendas  
The code is made interact with a **SQL Server Database** (tested on Microsoft Azure)  
[Link to Open Agenda Database](https://github.com/antoinesauray/Open-Agenda-Database)  
[Link to Provider Database (not necessary)](https://github.com/antoinesauray/Open-Agenda-ProviderDB)  
## How to use
* cd in the root directory
* Generate a private key  
``` openssl genrsa -out key.pem 2048 ```
* Generate an associated public key  
``` openssl rsa -in newkey.pem -pubout -outform PEM -out cert.pem ```
* Set the required environment variables. Use ```export``` on Linux, $env:VARIABLE on Windows
* * ``` DB_HOST = "127.0.0.1" ```  
The database host
* * ``` DB_PORT = 1433 ```  
The database port
* * ``` FIREBASEKEY = "key" ```  
A firebase project key. If you do not want to use firebase, make it anything. It will just ignore it.
* * ``` USER = "userlogin" ```  
The database login
* * ``` PASSWORD = "passwd" ```  
The database password
* * ``` DATABASE = "edtagenda" ```  
The database to use
* Start the API  
```npm install && node bin/edt ```