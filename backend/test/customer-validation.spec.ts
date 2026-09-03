import type { DatabaseService } from "../src/database/database.service";
import { CustomersService } from "../src/modules/customers/customers.service";

describe("customer record validation", () => {
  const customerId = "10000000-0000-0000-0000-000000000001";

  it("requires the contact channel selected by the customer", async () => {
    const { service, database } = setup();
    await expect(
      service.createProfile(customerId, {
        givenName: "Asha",
        familyName: "Silva",
        preferredContactMethod: "email",
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(database.rows).not.toHaveBeenCalled();
  });

  it("requires complete emergency contact details", async () => {
    const { service, database } = setup();
    await expect(
      service.createTraveller(customerId, {
        givenName: "Nimal",
        familyName: "Perera",
        emergencyContactName: "Asha",
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(database.rows).not.toHaveBeenCalled();
  });

  it("rejects impossible birth dates and reversed itinerary dates", async () => {
    const { service, database } = setup();
    await expect(
      service.createTraveller(customerId, {
        givenName: "Nimal",
        familyName: "Perera",
        dateOfBirth: "2027-02-29",
      }),
    ).rejects.toMatchObject({ status: 400 });
    await expect(
      service.createSavedItinerary(customerId, {
        title: "Reversed",
        travelStartDate: "2027-03-02",
        travelEndDate: "2027-03-01",
      }),
    ).rejects.toMatchObject({ status: 400 });
    expect(database.rows).not.toHaveBeenCalled();
  });

  it("rejects invalid wishlist slugs before persistence", async () => {
    const { service, database } = setup();
    await expect(
      service.createWishlist(customerId, { productSlug: "Not A Slug" }),
    ).rejects.toMatchObject({ status: 400 });
    expect(database.rows).not.toHaveBeenCalled();
  });
});

function setup(): {
  service: CustomersService;
  database: { rows: jest.Mock; $executeRaw: jest.Mock };
} {
  const database = { rows: jest.fn(), $executeRaw: jest.fn() };
  return {
    service: new CustomersService(database as unknown as DatabaseService),
    database,
  };
}
