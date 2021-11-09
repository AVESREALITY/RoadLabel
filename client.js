class Client {
    constructor() {
        this.base_url = "backend/";
    }

    request(data) {
        return new Promise((resolve, reject) => {
            fetch(this.base_url, {
                method: 'POST', 
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              }).then(response => {
                  response.json().then(data => {
                    resolve(data);
                  }).catch((error) => {
                    console.log(error);
                    reject(error);
                  });
              })
              
            });
        
    }
    request_d(data) {
      return new Promise((resolve, reject) => {
          fetch(this.base_url, {
              method: 'POST', 
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(data),
            }).then(response => {
                response.text().then(data => {
                  resolve(data);
                }).catch((error) => {
                  console.log(error);
                  reject(error);
                });
            })
            
          });
      
  }

    getDatasets() {
       return this.request({action:'GetDatasets'});
    }
    addDataset(desc) {
        return this.request({action:'AddDataset',description:desc});
    }
    delDataset(idx) {
        return this.request({action:'DelDataset',id:idx});
    }

}

