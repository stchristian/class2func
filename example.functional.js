import React from "react";
import Head from "../components/Head";
import { isInPreviewMode } from "../utils/context";
import Dropdown from "../components/Dropdown";
import RichText from "../components/RichText";
import { cmsApi } from "../api";
import "./contact.scss";
const ContactPage = React.memo(props => {
    const renderServicePlace = (name, phone, email, key) => {
        return (<div className="place" key={key}>
        <div className="name">{name}</div>
        <div className="phone">Tel: {phone}</div>
        <div className="email">Email: {email}</div>
      </div>);
    };
    const { pageContent } = props;
    const [contact, faq] = pageContent.content.filter((content) => {
        return content.name === "contactContent" || content.name === "faq";
    });
    return (<div className="ContactPage">
        <Head title={pageContent.title} description={pageContent.description} keywords={pageContent.keywords}/>
        <div className="page-title">
          <h1>{contact.title}</h1>
          <h2>{contact.subtitle}</h2>
        </div>
        <div className="service-places">
          {contact.items.map((item, index) => renderServicePlace(item.name, item.phoneNumber, item.email, index))}
        </div>
        <div className="page-title">
          <h1>{faq.title}</h1>
        </div>
        <div className="faq-list">
          {faq.items &&
        faq.items.map((category, catIndex) => (<div key={catIndex}>
                <h2>{category.title}</h2>
                {category.items &&
            category.items.map((item, itemIndex) => (<Dropdown key={category.name + itemIndex} title={item.title}>
                      <RichText content={item.textContent}/>
                    </Dropdown>))}
              </div>))}
        </div>
      </div>);
});
ContactPage.getInitialProps = static async (ctx) => {
    const pageContent = await cmsApi.get(`/pages/contact${isInPreviewMode(ctx) ? "?preview" : ""}`);
    return { pageContent };
};
export default ContactPage;
