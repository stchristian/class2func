import React from "react";
import Head from "../components/Head";
import { isInPreviewMode } from "../utils/context";
import Dropdown from "../components/Dropdown";
import RichText from "../components/RichText";
import { cmsApi } from "../api";
import "./contact.scss";
const ContactPage = React.memo(props => {
    const [state, setState] = useState({
        hello: "asd",
        x: true,
    });
    const renderServicePlace = (name, phone, email, key) => {
        setState({
            hello: "asd",
        });
    };
    const handleX = () => {
        setState({
            x: false,
        });
    };
    return <div className="ContactPage">{state.hello}</div>;
});
ContactPage.getInitialProps = async (ctx) => {
    const pageContent = await cmsApi.get(`/pages/contact${isInPreviewMode(ctx) ? "?preview" : ""}`);
    return { pageContent };
};
export default ContactPage;
