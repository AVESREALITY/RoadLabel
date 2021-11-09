

<?php
    // ENTRYPOINTS:
    // Upload Images
    // Download Dataset
    // Remove (multiple) images
    // Update Image Annotation / Data
    // Fetch Images
    // Fetch Image Data -> Create Canvas Elements

    

    function connect() {

        $host = "";
        $user = "";
        $password = "";
        $dbName = "";
        try 
        {
            $pdo = new PDO("mysql:host=$host;dbname=$dbName", $user, $password);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            return $pdo;
        }catch(PDOException $e) 
        {
            die("Database connection error: " . $e->getMessage());
        }
    }

    class Database {
        public $pdo;
        private $dbName;

        function __construct($host,$username,$password,$dbName) {
            $this->dbName = $dbName;
            
        }
        
    }

    class dbDatasets extends Database {
        function __construct($host,$user,$password,$dbName) {
            parent::__construct($host,$user,$password,$dbName);
        }
        function exists() {
            return $this->pdo->query("SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE table_schema = '$this->dbName' AND table_name ='Datasets'" )->fetch();
        }
        function create() {
            $sql = "CREATE TABLE Datasets (
                ID INT NOT NULL AUTO_INCREMENT,
                Description VARCHAR(255) NOT NULL,
                Created TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (ID)
                );";
            $this->pdo->exec($sql);
        }

        function insert($description) {
            $sh = $this->pdo->prepare("INSERT INTO Datasets (Description) VALUES (?)");
            $sh->bindParam(1,$description);
            $sh->execute();
        }
        function delete() {
            $sql = "DROP TABLE Datasets";
            $this->pdo->exec($sql);
        }
    }

    //

    class Response {
        public $status = "FAILED";
        public $data;
        function __construct($status) {
            $this->status = $status;
        }
        function json() {
            echo json_encode($this);
        }
    }

    try {
    $datasetsTable = new dbDatasets($host,$user,$password,$dbName);
    $conn = connect();



    $request = json_decode(file_get_contents('php://input'));
    //var_dump($request);
    $action = $request->action;



    if ($action == "GetDatasets") {
        $sql = "SELECT ID,Description,Created FROM Datasets";

        $resp = new Response("OK");
        $resp->data = [];
        foreach ($conn->query($sql) as $row) {
            array_push($resp->data, $row);
        }
        echo json_encode($resp);
    }else if($action == "AddDataset") {
        $desc = $request->description;

        $sh = $conn->prepare("INSERT INTO Datasets (Description) VALUES (?);");
        $sh->execute([$desc]);
        $resp = new Response("OK");
        $resp->json();
    }else if($action == "DelDataset") {
        $id = $request->id;
        $sh = $conn->prepare("DELETE FROM Datasets WHERE ID=?;");
        $sh->execute([$id]);
        $resp = new Response("OK");
        $resp->json();
    }else if($action == "ImgUpload") {
        $name = $request->name;
        $base64 = $request->base64;

        $source = fopen($base64, 'r');
        $dest_file = "images/$name";
        $destination = fopen($dest_file, 'w');

        stream_copy_to_stream($source, $destination);

        fclose($source);
        fclose($destination);

        $resp = new Response("OK");
        $resp->data = ["url" => "backend/$dest_file"];
        $resp->json();
    }else if($action == "LoadImages") {
        $images =  array_diff(scandir("images"), array('..', '.'));
        $img_paths = array();

        foreach ($images as $img) {
            array_push($img_paths, [$img,"backend/images/$img"]);
        }
        $resp = new Response("OK");
        $resp->data = $img_paths;
        $resp->json();
    }else if($action == "DelImage") {
        $name = $request->name;
        unlink("images/$name");

        $sh = $conn->prepare("DELETE FROM Annotations WHERE Image=?;");
        $sh->execute([$name]);

        $resp = new Response("OK");
        $resp->json();
    }else if($action == "SaveAnnotation") {
        $image = $request->image;
        $annotation_count = $request->annotations->count;
        $annotations = json_encode($request->annotations);
     
        
            $resp = new Response("OK");

            $sh_query = $conn->prepare("SELECT ID FROM Annotations WHERE `Image` = ?");
            $sh_query->execute([$image]);

            if($sh_query->rowCount() == 0) 
            {
                // Insert Fresh
                $resp->data = "Inserting";
                $sh = $conn->prepare("INSERT INTO Annotations (Image,Annotation) VALUES (?,?);");
                $sh->execute([$image,$annotations]);
                
            }else{
                // Update Existing
                $resp->data = "Updating";
                $sh = $conn->prepare("UPDATE Annotations SET Annotation = ? WHERE  `Image` = ?");
                $sh->execute([$annotations, $image]);
            }
          
            $resp->json();
       
    }else if($action == "FetchAnnotation") {
        $image = $request->image;
        $sh_query = $conn->prepare("SELECT Annotation FROM Annotations WHERE `Image` = ?");
        $sh_query->execute([$image]);

        $resp = new Response("OK");
        $resp->data = $sh_query->fetch();
        $resp->json();
    }else if($action == "FetchAllAnnotations")
    {
        $resp = new Response("OK");
        $data = [];

        foreach($conn->query("SELECT * FROM Annotations")->fetchAll() as $row) {
            array_push($data,["Image"=>$row["Image"], "Annotation" => json_decode($row["Annotation"])]);
        }
        $resp->data = $data;
        $resp->json();
    }
    }catch(Exception $e){
        $resp = new Response("FAILED");
        $resp->data = $e->getMessage();
        $resp->json(); 
    }
?>