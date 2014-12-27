//var bootstrap=require("bootstrap"); 
var kde=require('ksana-document').kde;  // Ksana Database Engine
var kse=require('ksana-document').kse; // Ksana Search Engine (run at client side)
var Stacktoc=require("./stacktoccomponent.jsx");
var Swipe=require("./swipecomponent");
var Fileinstaller=require("ksana2015-webruntime").fileinstaller;

var DefaultmainMixin = {
  getInitialState: function() {
    return {res:{excerpt:[]},db:null , msg:"click GO button to search"};
  },
  swipetargets:[],
  action:function() {
    var args=Array.prototype.slice.call(arguments);
    var type=args.shift();

    if (!this.handlers) return;
    if (!this.handlers[type]) return;
    this.handlers[type].apply(this,args);
  }, 
  newTofind:function(tf) {
    if (!localStorage) return;
    var historytofind=JSON.parse(localStorage.getItem("historytofind")||"[]");
    var i=historytofind.indexOf(tf);
    if (i>-1) historytofind.splice(i,1);
    historytofind.push(tf);
    while(historytofind.length>5) {
      historytofind.shift();
    }
    localStorage.setItem("historytofind",JSON.stringify(historytofind));
    return historytofind;
  },
  search:function(tofind,start,end) {
    var t=new Date();
    if (this.state.q!=tofind) {
      this.newTofind(tofind);
    }
    this.setState({q:tofind,msg:"Searching"});
    var that=this;
    setTimeout(function(){
      kse.search(that.state.db,tofind,{range:{start:start,end:end,maxhit:25}},function(data){ //call search engine
        that.setState({res:data,msg:(new Date()-t)+"ms"});
        //console.log(data) ; // watch the result from search engine
      });
    },0);
  },
  dosearch:function(e,reactid,start_end) {
    var start=start_end,tochit=0;
    var end=this.state.db.get("meta").vsize;
    if (typeof start_end=="undefined") {
      start=0;
    }else if (typeof start_end!="number" && typeof start_end[0]=="number") {
      start=start_end[0];
      end=start_end[1];
      tochit=start_end[2];
    }
    var tofind=this.refs.tofind.getDOMNode().value;
    if (e) tofind=e.target.innerHTML;
    if (tofind=="GO") tofind=this.refs.tofind.getDOMNode().value;
    this.search(tofind,start,end);
  },
  keypress:function(e) {
    if (e.key=="Enter") this.dosearch();
  },
  renderExtraInput:function() {
    if (this.tofindExtra) {
      var historytofind=[];
      if (localStorage) {
        historytofind=JSON.parse(localStorage.getItem("historytofind")||"[]");  
      }
      return this.tofindExtra(historytofind);
    }
    else return null;
  },
  renderinputs:function() {  // input interface for search
    if (this.state.db) {
      return (    
        <div > 
        <div className="centered inputs"><input size="8" onKeyPress={this.keypress} ref="tofind" defaultValue={this.defaultTofind||""}></input>
        <button ref="btnsearch" onClick={this.dosearch}>GO</button>
        {this.renderExtraInput()}
        </div>
        {this.state.db.searchtime?Math.floor(this.state.db.searchtime)+" ms":""}
        {this.renderResultList()}
        </div>
        )          
    } else {
      return <span>loading database....</span>
    }
  }, 
  renderResultList:function() {
    var ResultListComponent=require("./resultlist.jsx");
    if (this.resultListComponent) {
      ResultListComponent=this.resultListComponent;
    }
    return <ResultListComponent gotopage={this.gotopage} 
    action={this.action} res={this.state.res}/>
  },
  genToc:function(texts,depths,voffs) {

    var out=[{depth:0,text:ksana.js.title}];
    if (texts) for (var i=0;i<texts.length;i++) {
      out.push({text:texts[i],depth:depths[i], voff:voffs[i]});
    }
    return out; 
  },     
  showPage:function(f,p,hideResultlist) {
    kse.highlightPage(this.state.db,f,p,{q:this.state.q,renderTags:this.renderTags},function(data){
      this.setState({bodytext:data});
      if (hideResultlist) this.setState({res:{excerpt:[]}});
    });
  },
  gotopage:function(vpos) {
    var res=kse.vpos2filepage(this.state.db,vpos);
    this.showPage(res.file,res.page);
    this.slideText();
  },
  nextpage:function() {
    if(!this.state.bodytext)return;
    var page=this.state.bodytext.page+1;
    this.showPage(this.state.bodytext.file,page);
  },
  prevpage:function() {
    if(!this.state.bodytext)return;
    var page=this.state.bodytext.page-1;
    if (page<0) page=0;
    this.showPage(this.state.bodytext.file,page);
  },
  setPage:function(newpagename,file) {
    file=file||this.state.bodytext.file;
    var pagenames=this.state.db.getFilePageNames(file);
    var p=pagenames.indexOf(newpagename);
    if (p>-1) this.showPage(file,p);
  },
  filepage2vpos:function() {
    var offsets=this.state.db.getFilePageOffsets(this.state.bodytext.file);
    return offsets[this.state.bodytext.page];
  },
  showText:function(n) {
    var res=kse.vpos2filepage(this.state.db,this.state.toc[n].voff);
    this.showPage(res.file,res.page);
    this.slideText();
  },
  onReady:function(usage,quota) {
    var head=this.tocTag||"head";
    if (!this.state.db) kde.open(this.dbid,function(db){
        this.setState({db:db});

        var preloadtags=[["fields",head],["fields",head+"_depth"],
          ["fields",head+"_voff"]];
        if (this.renderTags) {
          this.renderTags.map(function(tag){
            preloadtags.push(["fields",tag+"_start"]);
            preloadtags.push(["fields",tag+"_end"]);
          });
        }
        db.get([preloadtags],function() {
          var heads=db.get(["fields",head]);
          var depths=db.get(["fields",head+"_depth"]);
          var voffs=db.get(["fields",head+"_voff"]);
          var toc=this.genToc(heads,depths,voffs);//,toc:toc
          this.setState({toc:toc});
       });
    },this);      
    this.setState({dialog:false,quota:quota,usage:usage});
  },
  getRequire_kdb:function() {//return an array of require db from ksana.js
    var required=[];
    ksana.js.files.map(function(f){
      if (f.indexOf(".kdb")==f.length-4) {
        var slash=f.lastIndexOf("/");
        if (slash>-1) {
          var dbid=f.substring(slash+1,f.length-4);
          required.push({url:f,dbid:dbid,filename:dbid+".kdb"});
        } else {
          var dbid=f.substring(0,f.length-4);
          required.push({url:ksana.js.baseurl+f,dbid:dbid,filename:f});
        }        
      }
    });
    return required;
  },
  openFileinstaller:function(autoclose) {
    var require_kdb=this.getRequire_kdb().map(function(db){
      return {
        url:window.location.origin+window.location.pathname+db.dbid+".kdb",
        dbdb:db.dbid,
        filename:db.filename
      }
    })
    return <Fileinstaller quota="512M" autoclose={autoclose} needed={require_kdb} 
                     onReady={this.onReady}/>
  },
  fidialog:function() {
      this.setState({dialog:true});
  }, 
  showExcerpt:function(n) {
    var voff=this.state.toc[n].voff;
    var end=this.state.toc[n].end;
    var hit=this.state.toc[n].hit;
    this.dosearch(null,null,[voff,end,hit]);
    this.slideSearch();
  },
  syncToc:function(voff) {
    this.setState({goVoff:voff||this.filepage2vpos()});
    this.slideToc();
  },
  slideSearch:function() {
    $("body").scrollTop(0);
    if (this.refs.Swipe) this.refs.Swipe.swipe.slide(2);
  },
  slideToc:function() {
    $("body").scrollTop(0);
    if (this.refs.Swipe) this.refs.Swipe.swipe.slide(0);
  },
  slideText:function() {
    if (this.refs.Swipe) {
      $("body").scrollTop(0);
      this.refs.Swipe.swipe.slide(1);
    }
  },
  onSwipeStart:function(target) {
    if (target && this.swipable(target)) {
      this.swipetargets.push([target,target.style.background]);
      target.style.background="yellow";
    }
    if (this.swipetimer) clearTimeout(this.swipetimer);
    var that=this;
    this.swipetimer=setTimeout(function(){
      if(!that.swipetargets.length) return;
      that.swipetargets.map(function(t){
        t[0].style.background=t[1];
      });
      that.swipetargets=[];
    },3000);
  },
  swipable:function(target) {
    while (target && target.dataset && 
      typeof target.dataset.n=="undefined" && typeof target.dataset.vpos=="undefined" ) {
      target=target.parentNode;
    }
    if (target && target.dataset) return true;
  },
  tryTocNode:function(index,target){
    while (target && target.dataset && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset&&target.dataset.n) {
      if (index==2) {//filter search result
        this.showExcerpt(target.dataset.n);
      } else {
        var voff=this.state.toc[target.dataset.n].voff;
        this.gotopage(voff);  
      }    
      return true;
    }
  },
  tryResultItem:function(index,target) {
    while (target && target.dataset && typeof target.dataset.vpos=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset&&target.dataset.vpos) {
      var vpos=parseInt(target.dataset.vpos);
      if (index==1) {
        this.gotopage(vpos);
      } else {
       // this.syncToc(vpos);
      }
      return true;
    }
  },
  onSwipeEnd:function(target) {
    if (this.swipetargets.length) {
      this.swipetargets[0][0].style.background=this.swipetargets[0][1];
      this.swipetargets.shift();
    }
  },
  onTransitionEnd:function(index,slide,target) {
    if (!this.tryResultItem(index,target)) this.tryTocNode(index,target);
  },
  renderSlideButtons:function() {
    if (ksana.platform!="ios" && ksana.platform!="android") {
      return <div>
        <button onClick={this.slideToc}>Toc</button>
        <button onClick={this.slideText}>Text</button>
        <button onClick={this.slideSearch}>Search</button>
      </div>
    }
  },
  renderStacktoc:function() {
    return  <Stacktoc showText={this.showText}  
            showExcerpt={this.showExcerpt} hits={this.state.res.rawresult} 
            action={this.action}
            data={this.state.toc} goVoff={this.state.goVoff} 
            showTextOnLeafNodeOnly={true} />
  },
  renderShowtext:function(text,pagename) {
    var ShowTextComponent=require("./showtext.jsx");
    if (this.showTextComponent) {
      ShowTextComponent=this.showTextComponent;
    }
    return <ShowTextComponent pagename={pagename} text={text}
      dictionaries={this.dictionaries}
      action={this.action}
      nextpage={this.nextpage} setpage={this.setPage} prevpage={this.prevpage} syncToc={this.syncToc}/>
  },
  renderMobile:function(text,pagename) {
     return (
      <div className="main">
        <Swipe ref="Swipe" continuous={true} 
               transitionEnd={this.onTransitionEnd} 
               swipeStart={this.onSwipeStart} swipeEnd={this.onSwipeEnd}>
        <div className="swipediv">
          {this.renderStacktoc()}
        </div>
        <div className="swipediv">                 
          {this.renderShowtext(text,pagename)}
        </div>
        <div className="swipediv">
            {this.renderinputs()} 
        </div>
        </Swipe>
      </div>
      );
  },
  renderPC:function(text,pagename) {
    return <div className="main">
        <div className="col-md-3">
          {this.renderStacktoc()}
        </div>
        <div className="col-md-4">
            {this.renderinputs()} 
        </div>
        <div className="col-md-5">
            {this.renderShowtext(text,pagename)}
        </div>
      </div>
  },
  render: function() {  //main render routine
    if (!this.state.quota) { // install required db
        return this.openFileinstaller(true);
    } else {
      var text="";
      var pagename="";
      if (this.state.bodytext) {
        text=this.state.bodytext.text;
        pagename=this.state.bodytext.pagename;
      }
      if (ksanagap.platform=="chrome" || ksanagap.platform=="node-webkit") {
        return this.renderPC(text,pagename);
      } else {
        return this.renderMobile(text,pagename);
      }
  }
  } 
}

module.exports=DefaultmainMixin;