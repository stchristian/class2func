import React from "react";
import Head from "../components/Head";
import { isInPreviewMode } from "../utils/context";
import Dropdown from "../components/Dropdown";
import RichText from "../components/RichText";
import { cmsApi } from "../api";
import "./contact.scss";

export default class ContactPage extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      hello: "asd",
      x: true,
    };
  }

  static async getInitialProps(ctx) {
    const pageContent = await cmsApi.get(`/pages/contact${isInPreviewMode(ctx) ? "?preview" : ""}`);
    return { pageContent };
  }

  renderServicePlace(name, phone, email, key) {
    this.setState({
      hello: "asd",
    });
  }

  handleX() {
    this.setState({
      x: false,
    });
  }

  render() {
    return <div className="ContactPage">{this.state.hello}</div>;
  }
}
