

var backend = new Client();



var app = new Vue({
    el: '#app',
    data: {
      message: 'Hello Vue!',
      images: [{src: 'images/asdahd.jpg', name:'asdjasdj.png'}
          
      ],
      image_active: 0,
      active_drag: false,
      Canvas: [],
      SegCanvas: [],
      brightness: 100,
      Datasets: [],
      Categories: [{name: 'Forest', color:'rgb(0, 125, 0)'},{name: 'ForestLight', color:'rgb(0, 255, 0)'},{name: 'Wheat', color:'rgb(125,125,0)'},{name: 'Vineyard', color:'rgb(100,0,0)'}]
    },
    methods: {
        saveAnnotation: function() {
            // Get Annotation Data
            var AnnotationData = {count:0, quadrLines: []};
            for(el of this.Canvas.Elements) {
                if (el instanceof CanvasQuadr && el.TangentHandle != null) {
                    var data = {start:el.StartHandle.pos,tangent:el.TangentHandle.pos,end:el.EndHandle.pos};
                    AnnotationData.quadrLines.push(data);
                    AnnotationData.count++;
                }
            }
            backend.request_d({action:'SaveAnnotation', image:this.activeImage().name, annotations:AnnotationData}).then((r) => {
                console.log(r);
                console.log("Saved Annotation");
            });
           

        },
        downloadImages: function() {
            alert("Download Image");
        },
        downloadLabels: function() {
            backend.request({action:"FetchAllAnnotations"}).then((resp) => {
                
                const a = document.createElement("a");
                a.href = URL.createObjectURL(new Blob([JSON.stringify(resp.data, null, 2)], {
                    type: "application/json"
                }));
                a.setAttribute("download", "labels.json");
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);


            });
            // Go to Backend, Fetch

        },
        fetchAnnotation: function() {
            this.Canvas.Elements = [];
            backend.request({action:'FetchAnnotation',image:this.activeImage().name}).then((r) => {
                if(r.data != false) {
                    var annotation = JSON.parse(r.data.Annotation);
                    console.log("Fetched Anno",annotation);
                    annotation.quadrLines.forEach((el) => {
                        var CanvQuadr = new CanvasQuadr(el.start);
                        CanvQuadr.AddEndHandle(el.end);
                        CanvQuadr.AddTangentHandle(el.tangent);
                        CanvQuadr.selected = false;
                        
                        CanvQuadr.StartHandle.selected = false;
                        CanvQuadr.EndHandle.selected = false;
                        CanvQuadr.TangentHandle.selected = false;

                        this.Canvas.Elements.push(CanvQuadr);
                    });
                    console.log(this.Canvas.Elements);
                    console.log('FetchAnnotation',annotation);
                }
                this.Canvas.mode = this.Canvas.modes.quadr1;
                //this.Canvas.mode = this.Canvas.modes.brush;
                //this.Canvas.mode = this.Canvas.modes.none;
                this.Canvas.render();
            });
        },  
        activeImage: function() {
            return this.images[this.image_active];
        },
        loadImages: function() {
            backend.request({action:'LoadImages'}).then((resp) => {
                this.images = [];
                for(var img of resp.data) {
                    this.images.push( {src:img[1],name:img[0],elements:[],brightness:100.0,uploading:false});
                }
                
                this.setActiveImage(0);
                console.log(resp);
            });
        },
        setActiveImage: function (index) {
            //this.images[this.image_active].elements = this.Canvas.Elements;
            //this.saveAnnotation();
            this.Canvas.Elements = [];

            this.images[this.image_active].brightness = this.brightness;

            this.image_active = index;
            this.brightness = this.images[this.image_active].brightness;
            
            this.fetchAnnotation();
            
            //this.Canvas = new Canvas();
            //this.Canvas.Elements =  this.images[this.image_active].elements;
            
            
            //this.Canvas.render();

        },
        deleteElement: function(idx) {
            this.Canvas.Elements.splice(idx,1);
            this.Canvas.render();
            this.saveAnnotation();
        }, 
        toggleElement: function(idx) {
            this.Canvas.Elements[idx].visible = this.Canvas.Elements[idx].visible==false;
            this.Canvas.render();
        },
        imageDrop: function(e) {
            e.stopPropagation();
            e.preventDefault();
            var files = e.dataTransfer.files;
            for(file of files) {
                var reader = new FileReader();
                reader.onload = ((file) =>  {
                    return (content) => {
                        var imgContent = content.target.result;
                        this.triggerUpload(this.images.length, imgContent,file.name);
                        this.images.push({src:imgContent,name:file.name,elements:[],brightness:100.0,uploading:true});
                    }
                })(file);
                reader.readAsDataURL(file);
            }
            this.active_drag = false;
        },
        triggerUpload: function(idx,content,name) {
            console.log("Uploading: ", name);
            backend.request({action: 'ImgUpload',name:name,base64:content}).then((resp) => {
                var imgURL = resp.data.url;
                this.images[idx].src = imgURL;
                this.images[idx].uploading = false;
            });
        },
        imageDrag: function(e) {
            e.stopPropagation();
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            this.active_drag = true;
        },
        keyUp: function(e) {
            if(e.key == "Delete") {
                this.delImage();
            }
        },
        delImage: function() {
            var spliceIdx = this.image_active;
            if(spliceIdx == this.images.length-1)
            {
                this.image_active--;
            }           
            backend.request({action:"DelImage",name:this.images[spliceIdx].name}).then((r) => {
                
            });
            this.images.splice(spliceIdx,1);
            this.setActiveImage(this.image_active);
           
           
            
        }
    },
    watch: {
        brightness: function(val) {
            document.querySelector("#source").setAttribute('style', 'filter:brightness(' + val/100 + ');');
        }
    },
    mounted() {
        this.Canvas = new Canvas(document.querySelector('#canvas'),3);
        //this.SegCanvas = new Canvas(document.querySelector('#canvas2'),6);
    },
    created() {
        
        document.querySelector('#app').addEventListener('mouseup',(e) => {this.saveAnnotation(e)});
        document.addEventListener('keydown', (e) => {this.keyUp(e)});

        backend.getDatasets().then((resp) => {
            this.Datasets = resp.data;;
        });
        this.loadImages();
    }
  })