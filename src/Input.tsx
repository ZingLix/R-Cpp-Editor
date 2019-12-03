import React from "react";
import { Layout, Menu, Breadcrumb, Icon, Button } from "antd";
import { Input } from 'antd';
import { Upload, message } from 'antd';
const { TextArea } = Input;
const { SubMenu } = Menu;
const { Header, Content, Footer, Sider } = Layout;

export class InputArea extends React.Component {

  constructor(props){
    super(props)
    this.state={
      text:""
    };
  }

  state:{
    text:string
  }

  openfile_clk = () => {
    this.fileinput.click();

  }

  openfile=(ev)=>{
    var selectedFile = ev.target.files[0];
    var reader = new FileReader();
    reader.onload = (ev) => {
      this.setState({text:ev.target.result})
      
    }
    reader.readAsText(selectedFile);
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
            <TextArea rows={4} value={this.state.text} onChange={(e)=>{this.setState({text:e.target.value})}}/>
          </Content>
        </Layout>
      </Content>
    </Layout>)
  }
}