import React from "react";
import { Layout, Menu, Breadcrumb, Icon, Button } from "antd";
import { Input } from 'antd';
import xml2js from 'xml2js';
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
    console.log(AST)
    this.strInit()
    AST.ClassDecl.forEach((c)=>this.genCodeForClass(c))
    AST.FunctionDecl.forEach((c)=>this.genCodeForFunction(c))
    this.setState({text:this.tmpstr})
  }

  pushLine(line:string){
    if(line.length==0) this.tmpstr+='\n';
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
    data.memberVariables[0].variable.forEach(e=>{
      this.pushLine(this.genCodeForType(e.Stmt[0])+" "+e.$.name);
    })
    //data.memberFunctions
    this.cancelIndent();
    this.pushLine("}")
    this.pushLine("")
  }

  genCodeForFunction(data: any) {
    var signature="fn "+data.$.name+"("
    if(data.arguments[0]!=""){
      var arglist = data.arguments[0].argument
      for(var i=0;i<arglist.length;++i){
        var arg=arglist[i]
        signature += this.genCodeForType(arg.Stmt[0])+" "+arg.$.name
        if (i != arglist.length - 1) signature += ", "
      }
    }
    signature+=") -> "
    signature+=this.genCodeForType(data.returnType[0].Stmt[0])
    this.pushLine(signature)
    this.pushLine("{")
    this.addIndent()

    this.cancelIndent();
    this.pushLine("}")
    this.pushLine("")
  }

  genCodeForType(t){
    var tmp=t.$.name;
    if (t.argument!=undefined){
      tmp+='<'
      for(var i=0;i<t.argument.length;++i){
        tmp += this.genCodeForType(t.argument[i].Stmt[0])
        if(i!=t.argument.length-1)
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
            <TextArea rows={4} style={{height:800}} value={this.state.text} onChange={(e)=>{this.setState({text:e.target.value})}}/>
          </Content>
        </Layout>
      </Content>
    </Layout>)
  }
}