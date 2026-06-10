list1={"apple","orange","grape"}
a=input("Enter item name")
found=0
for i in list1:
    if(a.lower()==i):
        print("found item in list")
        found=1
        break;
if(found==0):
    print("Item not found")
