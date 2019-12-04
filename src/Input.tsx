import React from "react";
import { Layout, Menu, Breadcrumb, Icon, Button } from "antd";
import { Input } from 'antd';
import xml2js from 'xml2js';
import { sign } from "crypto";
const { TextArea } = Input;
const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;

export class InputArea extends React.Component {

  constructor(props){
    super(props)
    this.state={
      text:""
    };
    this.reader = new FileReader();
    this.reader.onload = (ev) => {
      //this.setState({text:ev.target.result})

      xml2js.parseString(ev.target.result, (err, res) => { console.log(res); this.generateCode(res); })
    }
  }

  state:{
    text:string
  }
  tmpstr:string;
  reader:any;
  indent:string;

  strInit(){
    this.tmpstr=""
    this.indent=""
  }

  openfile_clk = () => {
    this.fileinput.click();

  }

  openfile=(ev)=>{
    var selectedFile = ev.target.files[0];
    this.reader.readAsText(selectedFile);
  }

  generateCode(data:any){
    var AST=data.AST
    this.strInit()
    AST.ClassDecl.forEach((c)=>{
      this.genCodeForClass(c)
      this.pushLine("")
    })
    AST.FunctionDecl.forEach((c)=>{
      this.genCodeForFunction(c)
      this.pushLine("")
    })
    this.setState({text:this.tmpstr})
  }

  pushLine(line:string){
    if(line.length===0) this.tmpstr+='\n';
    else this.tmpstr+=this.indent+line+"\n";
  }

  addIndent(){
    this.indent+='\t'
  }

  cancelIndent(){
    this.indent=this.indent.substr(0,this.indent.length-1)
  }

  genCodeForClass(data:any){
    this.pushLine("class " + data.$.name )
    this.pushLine("{")
    this.addIndent()
    if (data.constructors[0].FunctionDecl!==undefined){
      data.constructors[0].FunctionDecl.forEach(e => {
        e.$.name = data.$.name
        this.genCodeForFunction(e, false)
        this.pushLine("")
      })
    }
    if (data.destructor !== undefined) {
      var dstor = data.destructor[0].FunctionDecl[0];
      dstor.$.name="~"+data.$.name
      this.genCodeForFunction(dstor,false)
    }
    data.memberFunctions[0].FunctionDecl.forEach(element => {
      this.genCodeForFunction(element)
      this.pushLine("")
    });
    data.memberVariables[0].variable.forEach(e => {
      this.pushLine(this.genCodeForType(e.Stmt[0]) + " " + e.$.name);
    })
    this.cancelIndent();
    this.pushLine("}")
    this.pushLine("")
  }

  genCodeForFunction(data: any,needPrefix:boolean=true) {
    var signature=""
    if(needPrefix) signature+="fn "
    signature+=data.$.name+"("
    if(data.arguments[0]!==""){
      var arglist = data.arguments[0].argument
      for(var i=0;i<arglist.length;++i){
        var arg=arglist[i]
        signature += this.genCodeForType(arg.Stmt[0])+" "+arg.$.name
        if (i !== arglist.length - 1) signature += ", "
      }
    }
    signature+=")"
    if(needPrefix){
      signature += " -> "
      signature += this.genCodeForType(data.returnType[0].Stmt[0])
    }

    if(data.$.external==="true") {
      signature += " external"
      this.pushLine(signature)
      return
    }
    this.pushLine(signature)
    this.pushLine("{")
    this.addIndent()
    if(data.body!==undefined){
      data.body[0].Stmt.forEach((s) => this.genCodeForExpression(s))
    }
      
    this.cancelIndent();
    this.pushLine("}")
  }

  genCodeForExpression(stmt:any){
    if (stmt.$ === undefined) {
      console.log(stmt)
    }
    var type = stmt.$.type;
    if (type === "ReturnStmt") {
      this.genCodeForReturnStmt(stmt);
    }
    else if (type === "ForStmt") {
      this.genCodeForForStmt(stmt)
    }
    else if(type==="IfStmt"){
      this.genCodeForIfStmt(stmt)
    }
    else if(type==="VariableDefStmt"){
      this.pushLine(this.genCodeForVariableDefStmt(stmt))
    }else if (type === "BinaryOperatorStmt") {
      this.pushLine(this.genCodeForBinOperatorStmt(stmt))
    }
    else{
      console.log(stmt)
    }
  }

  genCodeForStmt(stmt:any){
    if (stmt.$ === undefined) {
      console.log(stmt)
    }
    var type=stmt.$.type;
    if(type==="BinaryOperatorStmt"){
      return this.genCodeForBinOperatorStmt(stmt)
    }
    if(type==="FloatStmt"){
      return this.genCodeForFloatStmt(stmt)
    }
    if(type==="IntegerStmt"){
      return this.genCodeForIntegerStmt(stmt)
    }
    if(type==="TypeStmt"){
      return this.genCodeForType(stmt)
    }
    if(type==="UnaryOperatorStmt"){
      return this.genCodeForUnaryOperatorStmt(stmt)
    } 
    if (type === "VariableDefStmt") {
      return this.genCodeForVariableDefStmt(stmt)
    }
    if(type==="VariableStmt"){
      return this.genCodeForVariableStmt(stmt)
    }
  }

  genCodeForBinOperatorStmt(stmt:any){
    //console.log(stmt)
    var l = this.genCodeForStmt(stmt.LHS[0].Stmt[0])
    var r = this.genCodeForStmt(stmt.RHS[0].Stmt[0])
    var op = this.operatorIdToStr(parseInt(stmt.$.operator))
    if(op==="."||op==="->"||op==="::"){
      return l+op+r
    }else{
      return l+" "+op+" "+r
    }
  }

  genCodeForUnaryOperatorStmt(stmt:any){
    if(stmt.$.operator==="1"||stmt.$.operator==="2"){
      return this.genCodeForStmt(stmt.operand[0].Stmt[0])+this.operatorIdToStr(parseInt(stmt.$.operator))
    }else if(stmt.$.operator==="3"||stmt.$.operator==="4"){
      var str=this.genCodeForStmt(stmt.operand[0].Stmt[0])
      var arg=""
      if(stmt.argument!==undefined){
        for(var i=0;i<stmt.argument.length;++i){
          arg+=this.genCodeForStmt(stmt.argument[i].Stmt[0])
          if(i!==stmt.argument.length-1){
            arg+=", "
          }
        }
      }
      if (stmt.$.operator === "3"){
        return str+"("+arg+")"
      }else{
        return str+"["+arg+"]"
      }
    }
    return this.operatorIdToStr(parseInt(stmt.$.operator))+this.genCodeForStmt(stmt.operand[0])
  }

  genCodeForVariableDefStmt(stmt:any){
    var str = this.genCodeForType(stmt.type[0].Stmt[0])+" "+stmt.$.name 
    if(stmt.initVal!==undefined){
      str+=" = "+this.genCodeForStmt(stmt.initVal[0].Stmt[0])
    }
    return str
  }

  genCodeForVariableStmt(stmt:any){
    return stmt.$.name
  }

  genCodeForIntegerStmt(stmt){
    return this.genCodeForFloatStmt(stmt)
  }

  genCodeForFloatStmt(stmt:any){
    return stmt.$.value;
  }

  genCodeForForStmt(stmt:any){
    this.pushLine("for("+this.genCodeForStmt(stmt.start[0].Stmt[0])+"; "+this.genCodeForStmt(stmt.condition[0].Stmt[0])+"; "+this.genCodeForStmt(stmt.end[0].Stmt[0])+")")
    this.pushLine("{")
    this.addIndent()
    stmt.body[0].Stmt.forEach(s=> {
      this.genCodeForExpression(s)})
    this.cancelIndent()
    this.pushLine("}")
  }

  genCodeForIfStmt(stmt:any){
    this.pushLine("if("+this.genCodeForStmt(stmt.condition[0].Stmt[0])+")")
    this.pushLine("{")
    this.addIndent()
    stmt.then[0].Stmt.forEach(s=> this.genCodeForExpression(s))
    this.cancelIndent()
    this.pushLine("}")
    if(stmt.else!==undefined){
      this.pushLine("else")
      this.pushLine("{")
      this.addIndent()
      stmt.else[0].Stmt.forEach(s => this.genCodeForExpression(s))
      this.cancelIndent()
      this.pushLine("}")
    }
  }

  genCodeForReturnStmt(stmt:any){
    if(stmt.Stmt===undefined) this.pushLine("return")
    else this.pushLine("return "+ this.genCodeForStmt(stmt.Stmt[0]))
  }

  genCodeForType(t){
    if(t.$.type!=="TypeStmt") return t.$.value
    var tmp=t.$.name;
    if (t.argument!==undefined){
      tmp+='<'
      for(var i=0;i<t.argument.length;++i){
        tmp += this.genCodeForType(t.argument[i].Stmt[0])
        if(i!==t.argument.length-1)
          tmp+=", "
      }
      tmp+='>'
    }
    return tmp
  }

  fileinput:any;

  public render() {
    return (<Layout>
      <input type="file" className="filechoose" ref={(i)=>{this.fileinput=i}} onChange={this.openfile} style={{display:"none"}}></input>
      <Content style={{ padding: "50px 50px" }}>
        <Button onClick={this.openfile_clk} style={{marginBottom:"24px"}}>
          
            <Icon type="upload" /> 打开文件
        
        </Button>
        <Layout style={{ paddingTop: "50px", background: "#fff" }}>
          <Sider width={200} style={{ background: "#fff" }}>
            <Menu
              mode="inline"
              defaultSelectedKeys={["1"]}
              defaultOpenKeys={["sub1"]}
              style={{ height: "100%" }}
            >
              <SubMenu
                key="sub1"
                title={
                  <span>
                    <Icon type="user" />
                    Decl
                    </span>
                }
              >
                <Menu.Item key="1">FunctionDecl</Menu.Item>
                <Menu.Item key="2">ClassDecl</Menu.Item>
              </SubMenu>
              <SubMenu
                key="sub2"
                title={
                  <span>
                    <Icon type="laptop" />
                    Statement
                    </span>
                }
              >
                <Menu.Item key="5">ForStmt</Menu.Item>
                <Menu.Item key="6">VariableStmt</Menu.Item>
                <Menu.Item key="7">VariableDefStmt</Menu.Item>
                <Menu.Item key="8">IfStmt</Menu.Item>
              </SubMenu>
            </Menu>
          </Sider>
          <Content style={{ padding: "0 24px 24px 24px", minHeight: 280 }}>
            <TextArea rows={4} style={{ height: 800, fontFamily: "Consolas, 'Courier New', monospace",tabSize:4}} value={this.state.text} onChange={(e)=>{this.setState({text:e.target.value})}}/>
          </Content>
        </Layout>
      </Content>
    </Layout>)
  }

  operatorIdToStr(id:number){
    switch(id){
      case 0: return "::"
      case 1: return "++"
      case 2: return "--"
      case 3: return "()"
      case 4: return "[]"
      case 5: return "."
      case 6: return "->"
      case 7: return "++"
      case 8: return "--"
      case 9: return "+"
      case 10: return "-"
      case 11: return "!"
      case 12: return "~"
      case 13: return "*"
      case 14: return "*"
      case 15: return "/"
      case 16: return "%"
      case 17: return "+"
      case 18: return "-"
      case 19: return "<<"
      case 20: return ">>"
      case 21: return "<"
      case 22: return "<="
      case 23: return ">"
      case 24: return ">="
      case 25: return "=="
      case 26: return "!="
      case 27: return "&"
      case 28: return "^"
      case 29: return "|"
      case 30: return "&&"
      case 31: return "||"
      case 32: return "="
      case 33: return "+="
      case 34: return "-="
      case 35: return "*="
      case 36: return "/="
      case 37: return "%="
      case 38: return "<<="
      case 39: return ">>="
      case 40: return "&="
      case 41: return "^="
      case 42: return "|="
      default: return "<unknown>"
    }
  }
}