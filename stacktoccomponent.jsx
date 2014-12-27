/** @jsx React.DOM */

var trimHit=function(hit) {
  if (hit>999) { 
    return (Math.floor(hit/1000)).toString()+"K+";
  } else return hit.toString();
}
var trimText=function(text,opts) {
    if (opts.maxitemlength && text.length>opts.maxitemlength) {
      var stopAt=opts.stopAt||"";
      if (stopAt) {
        var at=opts.maxitemlength;
        while (at>10) {
          if (text.charAt(at)==stopAt) return text.substr(0,at)+"...";
          at--;
        }
      } else {
        return text.substr(0,opts.maxitemlength)+"...";
      }
    } 
    return text;
}
var renderDepth=function(depth,opts,nodetype) {
  var out=[];
  if (opts.tocstyle=="vertical_line") {
    for (var i=0;i<depth;i++) {
      if (i==depth-1) {
        out.push(<img src={opts.tocbar_start}></img>);
      } else {
        out.push(<img src={opts.tocbar}></img>);  
      }
    }
    return out;    
  } else {
    if (depth) return <span>{depth}.</span>
    else return null;
  }
  return null;
};

var Ancestors=React.createClass({
  goback:function(e) {
    var n=e.target.dataset["n"];  
    if (typeof n=="undefined") n=e.target.parentNode.dataset["n"];
    this.props.setCurrent(n); 
  },
  showExcerpt:function(e) {
    var n=parseInt(e.target.parentNode.dataset["n"]);
    e.stopPropagation();
    e.preventDefault();
    this.props.showExcerpt(n);
  }, 
  showHit:function(hit) {
    if (hit)  return <a href="#" onClick={this.showExcerpt} className="pull-right badge hitbadge">{trimHit(hit)}</a>
    else return <span></span>;
  },
  renderAncestor:function(n,idx) {
    var hit=this.props.toc[n].hit;
    var text=this.props.toc[n].text.trim();
    text=trimText(text,this.props.opts);
    if (this.props.textConverter) text=this.props.textConverter(text);
    return <div key={"a"+n} className="node parent" data-n={n} onClick={this.goback} >{renderDepth(idx,this.props.opts,"ancestor")}<a className="text" href="#" >{text}</a>{this.showHit(hit)}</div>
  },
  render:function() {
    if (!this.props.data || !this.props.data.length) return <div></div>;
    return <div>{this.props.data.map(this.renderAncestor)}</div>
  } 
}); 
var Children=React.createClass({
  getInitialState:function() {
    return {selected:0};
  },
  shouldComponentUpdate:function(nextProps,nextState) {
    if (nextProps.data.join()!=this.props.data.join() ) {
      nextState.selected=parseInt(nextProps.data[0]);
    }
    return true;
  },
  open:function(e) {
    var n=e.target.parentNode.dataset["n"];
    if (typeof n!=="undefined") this.props.setCurrent(parseInt(n));
  }, 
  showHit:function(hit) {
    if (hit)  return <a href="#" onClick={this.showExcerpt} 
      className="pull-right badge hitbadge">{trimHit(hit)}</a>
    else return <span></span>;
  },
  showExcerpt:function(e) {
    var n=parseInt(e.target.parentNode.dataset["n"]);
    e.stopPropagation();
    e.preventDefault();
    this.props.hitClick(n);
  }, 
  nodeClicked:function(e) {
    var target=e.target;
    while (target && typeof target.dataset.n=="undefined")target=target.parentNode;
    if (!target) return;
    var n=parseInt(target.dataset.n);
    var child=this.props.toc[n];
    if (this.props.showTextOnLeafNodeOnly) {
      if (child.hasChild) {
        this.open(e);
      } else {
        this.showText(e);
      }
    } else {
      if (n==this.state.selected) {
        if (child.hasChild) this.open(e);
        else this.showText(e);
      } else {
        this.showText(e);
      }
    }
    this.setState({selected:n});
  },
  renderChild:function(n) {
    var child=this.props.toc[n];
    var hit=this.props.toc[n].hit;
    var classes="node child",haschild=false;  
    //if (child.extra) extra="<extra>"+child.extra+"</extra>";
    if (!child.hasChild) classes+=" nochild";
    else haschild=true;
    var selected=this.state.selected;
    if (this.props.showTextOnLeafNodeOnly) {
      selected=n;
    }

    var classes="btn btn-link";
    if (n==selected) {
      if (haschild) classes="btn btn-default expandable";
      else classes="btn btn-link link-selected";
    }

    var text=this.props.toc[n].text.trim();
    var depth=this.props.toc[n].depth;
    text=trimText(text,this.props.opts)
    if (this.props.textConverter) text=this.props.textConverter(text);
    return <div key={"child"+n} data-n={n}>{renderDepth(depth,this.props.opts,"child")}<a data-n={n} className={classes +" tocitem text"}  onClick={this.nodeClicked}>{text+" "}</a>{this.showHit(hit)}</div>
  },
  showText:function(e) { 
    var target=e.target;
    var n=e.target.dataset.n;
    while (target && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset.n && this.props.showText) {
      this.props.showText(parseInt(target.dataset.n));
    }
  },
  render:function() {
    if (!this.props.data || !this.props.data.length) return <div></div>;
    return <div>{this.props.data.map(this.renderChild)}</div>
  }
}); 

var stacktoc = React.createClass({
  getInitialState: function() {
    return {bar: "world",tocReady:false,cur:0};//403
  },
  buildtoc: function() {
      var toc=this.props.data;
      if (!toc || !toc.length) return;  
      var depths=[];
      var prev=0;
      for (var i=0;i<toc.length;i++) {
        var depth=toc[i].depth;
        if (prev>depth) { //link to prev sibling
          if (depths[depth]) toc[depths[depth]].next = i;
          for (var j=depth;j<prev;j++) depths[j]=0;
        }
        if (i<toc.length-1 && toc[i+1].depth>depth) {
          toc[i].hasChild=true;
        }
        depths[depth]=i;
        prev=depth;
      } 
  }, 
  enumAncestors:function() {
    var toc=this.props.data;
    if (!toc || !toc.length) return;
    var cur=this.state.cur;
    if (cur==0) return [];
    var n=cur-1;
    var depth=toc[cur].depth - 1;
    var parents=[];
    while (n>=0 && depth>0) {
      if (toc[n].depth==depth) {
        parents.unshift(n);
        depth--;
      }
      n--;
    }
    parents.unshift(0); //first ancestor is root node
    return parents;
  },
  enumChildren : function() {
    var cur=this.state.cur;
    var toc=this.props.data;

    var children=[];
    if (!toc || !toc.length || toc.length==1) return children;

    if (toc[cur+1].depth!= 1+toc[cur].depth) return children;  // no children node
    var n=cur+1;
    var child=toc[n];
    while (child) {
      children.push(n);
      var next=toc[n+1];
      if (!next) break;
      if (next.depth==child.depth) {
        n++;
      } else if (next.depth>child.depth) {
        n=child.next;
      } else break;
      if (n) child=toc[n];else break;
    }

    return children;
  },
  rebuildToc:function() {
    if (!this.state.tocReady && this.props.data) {
      this.buildtoc();
      this.setState({tocReady:true});
    }
  },
  componentDidMount:function() {
    this.rebuildToc();
  },
  componentDidUpdate:function() {
    this.rebuildToc();
  },   
  setCurrent:function(n) {
    n=parseInt(n);
    this.setState({cur:n});
    var child=this.props.data[n];
    if (!(child.hasChild && this.props.showTextOnLeafNodeOnly)) {
      this.props.showText(n);
    }
  },
  findByVoff:function(voff) {
    for (var i=0;i<this.props.data.length;i++) {
      var t=this.props.data[i];
      if (t.voff>voff) return i-1;
    }
    return 0; //return root node
  },
  shouldComponentUpdate:function(nextProps,nextState) {
    if (nextProps.goVoff&&nextProps.goVoff !=this.props.goVoff) {
      nextState.cur=this.findByVoff(nextProps.goVoff);
    }
    return true;
  },
  fillHit:function(nodeIds) {
    if (typeof nodeIds=="undefined") return;
    if (typeof nodeIds=="number") nodeIds=[nodeIds];
    var toc=this.props.data;
    var hits=this.props.hits;
    if (toc.length<2) return;
    var getRange=function(n) {
      if (n+1>=toc.length) {
        console.error("exceed toc length",n);
        return;
      }
      var depth=toc[n].depth , nextdepth=toc[n+1].depth;
      if (n==toc.length-1 || n==0) {
          toc[n].end=Math.pow(2, 48);
          return;
      } else  if (nextdepth>depth){
        if (toc[n].next) {
          toc[n].end= toc[toc[n].next].voff;  
        } else { //last sibling
          var next=n+1;
          while (next<toc.length && toc[next].depth>depth) next++;
          if (next==toc.length) toc[n].end=Math.pow(2,48);
          else toc[n].end=toc[next].voff;
        }
      } else { //same level or end of sibling
        toc[n].end=toc[n+1].voff;
      }
    }
    var getHit=function(n) {
      var start=toc[n].voff;
      var end=toc[n].end;
      if (n==0) {
        toc[0].hit=hits.length;
      } else {
        var hit=0;
        for (var i=0;i<hits.length;i++) {
          if (hits[i]>=start && hits[i]<end) hit++;
        }
        toc[n].hit=hit;
      }
    }
    nodeIds.forEach(function(n){getRange(n)});
    nodeIds.forEach(function(n){getHit(n)});
  },
  fillHits:function(ancestors,children) {
      this.fillHit(ancestors);
      this.fillHit(children);
      this.fillHit(this.state.cur);
  },
  hitClick:function(n) {
    if (this.props.showExcerpt)  this.props.showExcerpt(n);
  },
  onHitClick:function(e) {
    e.stopPropagation();
    e.preventDefault();
    this.hitClick(this.state.cur);
  },
  showHit:function(hit) {
    if (hit)  return <a href="#" onClick={this.onHitClick} className="pull-right badge hitbadge">{trimHit(hit)}</a>
    else return <span></span>;
  },
  showText:function(e) {
    var target=e.target;
    var n=e.target.dataset.n;
    while (target && typeof target.dataset.n=="undefined") {
      target=target.parentNode;
    }
    if (target && target.dataset.n && this.props.showText) {
      this.props.showText(parseInt(target.dataset.n));
    }
  },

  render: function() {
    if (!this.props.data || !this.props.data.length) return <div></div>
    var depth=this.props.data[this.state.cur].depth+1;
    var ancestors=this.enumAncestors();
    var children=this.enumChildren();
    var opts=this.props.opts||{};
    var current=this.props.data[this.state.cur];
    if (this.props.hits && this.props.hits.length) {
      this.fillHits(ancestors,children);
    }

    var text=current.text.trim();
    text=trimText(text,opts);
    if (this.props.textConverter) text=this.props.textConverter(text);
    return ( 
      <div className="stacktoc"> 
        <Ancestors opts={opts} textConverter={this.props.textConverter} showExcerpt={this.hitClick} setCurrent={this.setCurrent} toc={this.props.data} data={ancestors}/>
        <div className="node current">{renderDepth(depth-1,opts,"current")}<a href="#" onClick={this.showText} data-n={this.state.cur}><span className="text">{text}</span></a>{this.showHit(current.hit)}</div>
        <Children opts={opts} textConverter={this.props.textConverter}  showTextOnLeafNodeOnly={this.props.showTextOnLeafNodeOnly}
                  showText={this.props.showText} hitClick={this.hitClick} setCurrent={this.setCurrent} toc={this.props.data} data={children}/>
      </div>
    ); 
  }
});
module.exports=stacktoc;